---
layout: post
title: Golang处理gRPC请求/响应元数据
date: 2024-02-29
categories: [Go]
tags: [Go, gRPC, metadata, 元数据]
excerpt: 简单总结Golang中对gRPC请求及响应的元数据处理。
---

前段时间实现内部gRPC框架时，为了实现在服务端拦截器中打印请求及响应的头部信息，便查阅了部分关于元数据的资料。因为中文网络上对于该领域的信息较少，于是在这做了一些简单的总结。

## 元数据

gRPC的元数据（metadata）是基于HTTP/2头部实现的键值对数据，它通常用来实现gRPC的鉴权、链路跟踪以及自定义头部数据等功能。

gRPC的元数据分为两种类型，分别是`Header`及`Trailer`。`Header`可以由客户端或服务端发送，它在客户端请求数据或服务器响应数据前发送。`Trailer`是一种特殊的头部信息，它仅可由服务端发送，且位于发送的数据之后。

## 客户端处理

在gRPC客户端中，无论是一元调用还是流调用，可以比较简单地通过`google.golang.org/grpc/metadata`包提供的`AppendToOutgoingContext`或`NewOutgoingContext`方法向请求中加入头部元数据，例如以下几种方式：

```go
// 通过metadata创建新的context
md := metadata.Pairs("k1", "v1", "k2", "v2")
ctx := metadata.NewOutgoingContext(ctx, md)

// 或是向context中添加元数据
ctx = metadata.AppendToOutgoingContext(ctx, "k3", "v3")

// ... 通过ctx进行RPC调用
```

对于服务端返回的响应中的元数据，一元调用与流调用的处理方式就较为不同。对于一元调用，需要提前定义好用于存储元数据的变量，然后在调用时通过`grpc.Header`或`grpc.Trailer`增加调用的选项：

```go
var header, trailer metadata.MD
resp, err := cli.UnaryCall(ctx, req, grpc.Header(&header), grpc.Trailer(&trailer))

// 处理header或trailer
```

而对于任意方式的流调用，都可以简单地通过流调用返回流的`Header`或`Trailer`方法获得元数据：

```go
stream, err := cli.StreamCall(ctx)

header, err := stream.Header()
trailer, err := stream.Trailer()
```

## 服务端处理

对于服务端，请求的元数据需要通过`metadata.FromIncomingContext`从context中获取：

```go
// 一元调用
md, ok := metadata.FromIncomingContext(ctx)

// 流调用
ctx := stream.Context() // 需要先从流中得到context
md, ok := metadata.FromIncomingContext(ctx)
```

同样，在服务端发送元数据需要根据一元调用与流调用使用不同的方式。对于一元调用，可以通过`grpc.SendHeader`、`grpc.SetHeader`以及`grpc.SetTrailer`方法设置发送的元数据，例如：

```go
header := metadata.Pairs("header-key", "header-val")
grpc.SendHeader(ctx, header)
trailer := metadata.Pairs("trailer-key", "trailer-val")
grpc.SetTrailer(ctx, trailer)
```

对于上述的`SendHeader`及`SetHeader`方法，其区别为`SendHeader`方法只能调用一次，而`SetHeader`方法将会对所有调用的元数据进行合并发送。

对于流调用，服务端发送元数据则是通过流对象中的上述方法：

```go
header := metadata.Pairs("header-key", "header-val")
stream.SendHeader(,header)
trailer := metadata.Pairs("trailer-key", "trailer-val")
stream.SetTrailer(trailer)
```

## 服务器拦截器处理

对于gRPC服务端一元调用及流调用拦截器，请求元数据的读取与响应元数据的发送与上一节中的实现相同，便不再赘述。下面我们将讨论一下在拦截器中更新请求元数据，以及读取响应的元数据。


### 一元调用拦截器更新请求元数据

在服务端拦截器中更新请求的元数据，其实现的方式与客户端发送元数据类似，即需要通过更新后的元数据创建新的context。对于一元调用拦截器，其简单实现如下所示：

```go
md, ok := metadata.FromIncomingContext(ctx)

md.Append("new-key", "new-value")
ctx = metadata.NewIncomingContext(ctx, md)

resp, err := handler(ctx, req) // 传递context至handler中
```

### 一元调用拦截器读取响应元数据

对于一元调用响应的元数据，gRPC未提供直接访问的方法响应的元数据。为了在拦截器中能读取到响应的元数据，我们可以通过覆盖原始`grpc.ServerTransportStream`并对设置的元数据进行备份的方式进行实现。

```go
type WrappedServerTransportStream struct {
  grpc.ServerTransportStream

  header  metadata.MD
  trailer metadata.MD
}

func (s *WrappedServerTransportStream) SendHeader(md metadata.MD) error {
  if err := s.ServerTransportStream.SendHeader(md); err != nil {
    return err
  }

  s.header = md

  return nil
}

// 在需要的情况下继续实现下面的几个方法：
// func (s *WrappedServerTransportStream) SetHeader(metadata.MD) error
// func (s *WrappedServerTransportStream) SetTrailer(metadata.MD) error
```

在定义带有元数据副本的`ServerTransportStream`实现后，我们需要通过`grpc.ServerTransportStreamFromContext`获取到一元调用的原始流，在对其进行封装后，调用`grpc.NewContextWithServerTransportStream`创建新的context。

```go
stream := grpc.ServerTransportStreamFromContext(ctx)
wrappedStream := &WrappedServerTransportStream{
  ServerTransportStream: stream,
}
ctx = grpc.NewContextWithServerTransportStream(ctx, wrappedStream)

resp, err := handler(ctx, req)

// 通过wrappedStream.header、wrappedStream.trailer读取响应的元数据
```

> 需要注意，`grpc.ServerTransportStream`接口是一个实验性的接口，在后续版本中可能会被移除，所以本节中描述的方法在后续版本中可能不再可用。

### 流调用拦截器更新请求元数据

而对于流调用，gRPC没有提供修改其context的方法，为了实现修改流调用请求元数据，就需要实现`grpc.ServerStream`接口并加入带有修改后元数据的context。以下是一个简单的实现：

```go
type WrappedStream struct {
  grpc.ServerStream
  ctx context.Context
}

func (s *WrappedStream) Context() context.Context {
  return s.ctx
}

func ExampleStreamInterceptor(srv any, ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
  md, ok := metadata.FromIncomingContext(ss.Context())
  md.append("new-key", "new-value")

  ctx := metadata.NewIncomingContext(ss.Context(), md)

  return handler(srv, &WrappedStream{ss, ctx})
}
```

### 流调用拦截器读取响应元数据

与在一元调用拦截器中相同，若需要在流调用拦截器中读取响应的元数据，我们可以实现`grpc.ServerStream`接口，并在其中保存元数据的副本。例如我们可以在上节的`WrappedStream`的基础上，对其进行一定修改：

```go
type WrappedStream struct {
  grpc.ServerStream

  header  metadata.MD
  trailer metadata.MD
}

func (s *WrappedStream) SendHeader(md metadata.MD) error {
  if err := s.ServerStream.SendHeader(md); err != nil {
    return err
  }

  s.header = md

  return nil
}

// 继续实现SetHeader、SetTrailer等方法

func ExampleStreamInterceptor(srv any, ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
  stream := &WrappedStream{ServerStream: ss}
  err := handler(srv, stream)

  // 通过stream.header、stream.trailer读取响应元数据

  return err
}
```

## 参考资料

- [Metadata - gRPC Guides](https://grpc.io/docs/guides/metadata/)
- [gRPC Metadata Go Documentation](https://github.com/grpc/grpc-go/blob/master/Documentation/grpc-metadata.md)
- [Metadata interceptor example](https://github.com/grpc/grpc-go/tree/master/examples/features/metadata_interceptor)
- [ServerInterceptor how to get header/trailer data - GitHub Issues](https://github.com/grpc/grpc-go/issues/4317)
