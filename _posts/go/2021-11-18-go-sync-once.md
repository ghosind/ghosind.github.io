---
layout: post
title: Go源码分析之sync.Once
date: 2021-11-18
categories: [Go]
tags: [Go, sync, Once]
excerpt: Golang标准库`sync.Once`对象源码分析及示例演示，并通过`sync.Once`实现单例模式。
---

Golang标准库中的`sync.Once`是一个线程安全的用于执行一次性操作的对象。对于同一个`sync.Once`对象，在第一次执行其`Do`方法时将调用该方法的参数函数，而完成后再次调用`Do`方法也不会再执行该参数函数。

例如下列实例中，将在循环中新建一个`goroutine`并调用`once.Do`方法，并将会打印`Only once`文本的`onceBody`方法作为参数传递至`once.Do`方法中。随后通过`channel`确保所有`goroutine`都执行完成：

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var once sync.Once
	onceBody := func() {
		fmt.Println("Only once")
	}
	done := make(chan bool)
	for i := 0; i < 10; i++ {
		go func() {
			once.Do(onceBody)
			done <- true
		}()
	}
	for i := 0; i < 10; i++ {
		<-done
	}
}
```

保存并运行上列实例代码，程序将只打印一次`Only once`文本。

```bash
$ go run once.go
Only once
```

## `sync.Once`源码分析

在上文中我们已经知道，`sync.Once`是通过一个对象实现的，我就先来看看它的属性都包括哪些：

```go
type Once struct {
  done uint32
  m    Mutex
}
```

可以看到，`Once`结构体只包含了两个属性，分别为`uint32`类型的`done`以及`sync.Mutex`类型的`m`，它们分别为标记是否已经执行过的标志以及执行时所用的互斥锁。

该结构体将`done`属性放置于结构体中的第一个位置，是利用了一种名为`hot path`的优化。其在AMD64/368架构下CPU将使用更为紧凑的指令，而在其它架构下也将减少需要的指令数量（`sync.Once`实例指针地址即其`done`属性的地址，避免了计算偏移地址）。

除了结构体外，`sync.Once`还包括了一个公开的方法`Do`：

```go
func (o *Once) Do(f func()) {
  // Note: Here is an incorrect implementation of Do:
	//
	//	if atomic.CompareAndSwapUint32(&o.done, 0, 1) {
	//		f()
	//	}
	//
	// Do guarantees that when it returns, f has finished.
	// This implementation would not implement that guarantee:
	// given two simultaneous calls, the winner of the cas would
	// call f, and the second would return immediately, without
	// waiting for the first's call to f to complete.
	// This is why the slow path falls back to a mutex, and why
	// the atomic.StoreUint32 must be delayed until after f returns.
  if atomic.LoadUint32(&o.done) == 0 {
    o.doSlow(f)
  }
}
```

`Once.Do`方法的实现非常简单，通过`atomic.LoadUint32`获取`Once`实例的`done`属性值。若`done`值为0时，表示函数`f`未被调用过或正运行中且未结束，则将调用`doSlow`方法；若`done`值为1时，表示函数`f`已经调用且完成，则直接返回。

这里使用了原子操作方法`atomic.LoadUint32`而不是直接将`o.done`进行比较，也是为了避免并发状态下错误地判断执行状态，产生不必要的锁操作带来的时间开销。

另外，我们可以在代码的注释文档中可以看到开发者标记的一种通过`atomic.CompareAndSwapUint32`的错误实现。使用`atomic.CompareAndSwapUint32`实现时，若有两次调用同时进行时，竞争成功的调用将进入函数`f`，而失败的调用将直接返回。在这种情况下，将不能保证所有所有的调用都将返回正确的结果。

```go
func (o *Once) doSlow(f func()) {
  o.m.Lock()
  defer o.m.Unlock()
  if o.done == 0 {
    defer atomic.StoreUint32(&o.done, 1)
    f()
  }
}
```

`Once.doSlow`方法的实现使用了传统的互斥锁`Mutex`操作，在执行时即调用`o.m.Lock`方法获得锁，然后再继续判断是否已经完成并调用`f`函数。可以看到，在获得锁后还需要对`o.done`的值进行一次判断，避免了`f`函数被重复调用。

最后，在退出`doSlow`方法时还需要对获取的锁进行释放，若进入到`f`函数的调用则需要更改`o.done`属性值。

## 使用`sync.Once`实现单例模式示例

`sync.Once`可被用于单例模式的实现中。在不使用`sync.Once`的情况下为了实现一个线程安全的单例，我们通常会使用`sync.Mutex`对获取单例的方法进行加锁，例如下面的示例：

```go
var ins *SingletonType
var locker sync.Mutex

func GetSingleton() {
  locker.Lock()
  defer locker.Unlock()

  if ins == nil {
    ins = &SingletonType{}
  }

  return ins
}
```

而在使用`sync.Once`的情况下，我们只需要在单例未初始化的情况下调用`once.Do`进行初始化操作即可，而无需每次都进行互斥锁的操作，减少了锁操作消耗的时间：

```go
var ins *SingletonType
var once sync.Once

func GetSingleton() {
  once.Do(func () {
    ins = &SingletonType{}
  })

  return ins
}
```

使用`sync.Mutex`进行互斥锁的操作，是一个相对缓慢的过程。对比于`sync.Mutex`的实现方法，使用`sync.Once`能有效地提高程序的性能。
