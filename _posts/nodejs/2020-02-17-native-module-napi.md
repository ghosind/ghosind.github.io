---
layout: post
title: 通过N-API使用C/C++开发Node.js Native模块
date: 2020-02-17
categories: [Node.js]
tags: [Node.js, Native, N-API]
excerpt: 本文主要简单介绍Node.js中的N-API模块，并以一个简单的例子展示如何通过N-API使用C/C++开发Node.js Native模块。
---

## 什么是N-API

> N-API is an API for building native Addons. It is independent from the underlying JavaScript runtime (ex V8) and is maintained as part of Node.js itself. This API will be Application Binary Interface (ABI) stable across versions of Node.js. It is intended to insulate Addons from changes in the underlying JavaScript engine and allow modules compiled for one major version to run on later major versions of Node.js without recompilation. The ABI Stability guide provides a more in-depth explanation. <sup>[1]</sup>

## Hello N-API

下面，我们将使用N-API编写一个`hello`模块，其中包括一个`greeting`方法，其功能为返回一个`Hello N-API!`字符串。它实现的功能相当于下列Javascript代码。

```js
const greeting = () => {
  return 'Hello N-API!';
}

module.exports = {
  greeting,
};
```

### C/C++代码

首先，我们需要创建一个C/C++源文件，其内容如下：

```c
#include <node_api.h>

#include <assert.h>
#include <string.h>

/**
 * 定义greeting方法
 */
napi_value greeting(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value word;
  char *str = "Hello N-API!";

  // 创建"Hello N-API!"字符串
  status = napi_create_string_utf8(env, str, strlen(str), &word);

  assert(status == napi_ok);

  return word;
}

/**
 * 模块初始化方法
 */
napi_value init(napi_env env, napi_value exports) {
  napi_status status;
  // 创建greeting方法描述符
  napi_property_descriptor descriptor = {
    "greeting",
    0,
    greeting,
    0,
    0,
    0,
    napi_default,
    0,
  };

  // 定义模块exports中的属性
  status = napi_define_properties(env, exports, 1, &descriptor);
  assert(status == napi_ok);

  return exports;
}

// 定义NAPI模块
NAPI_MODULE(hello, init);
```

代码的第9-20行，定义了一个名为`greeting`的函数，它是一个将可以在Node.js使用的方法。使用NAPI定义Node.js调用的方法需要满足`napi_value (*)(napi_env, napi_callback_info)`的参数及返回值要求。该方法接收两个参数，分别为`napi_env`类型的参数`env`，及`napi_callback_info`类型的参数`info`，并返回`napi_value`类型的值。例子中主要使用了`env`参数，其用于存储虚拟机上下文。

`greeting`方法主要创建了一个JS字符串变量并将其返回。该方法通过`napi_create_string_utf8`函数创建了Javascript字符串对象，其值源自第二个参数传递的UTF-8编码的字符串。该方法的定义为：

```c
napi_status napi_create_string_utf8(napi_env env,
    const char *str,
    size_t length,
    napi_value* result);
```

`napi_create_string_utf8`的第一个参数为`greeting`函数的`env`函数，即当前虚拟机的上下文。`str`参数为将保存的对应值，并使用`length`参数告知`str`参数的长度，创建的字符串对象将使用`napi_value`类型`result`指针返回（`napi_value`类型用于指向Javascript值）。`napi_create_string_utf8`的返回值将返回字符串是否创建成功，若其值为`napi_ok`时即表示创建成功。

代码的25-44行定义了`init`函数，其为该模块的初始化方法。模块初始化方法需要满足`napi_value (*)(napi_env env, napi_value exports)`的格式要求，其返回值即模块的`exports`。

代码的28行定义了`greeting`方法的描述符，并在36行中通过`napi_define_properties`方法在`exports`中定义该对象属性。`napi_define_properties`函数的定义为：

```c
napi_status napi_define_properties(napi_env env,
    napi_value object,
    size_t property_count,
    const napi_property_descriptor *properties);
```

该方法用于定义JS对象中的属性，它将为`object`参数指向的JS对象增加`properties`参数指向的描述符数组所定义的属性，其新增属性的数量由`count`参数所表示。

最后，通过`NAPI_MODULE`宏注册模块，其第一个参数为该模块的名称，第二个参数为模块初始化方法。如例子中模块明为hello，初始化方法为定义的`init`函数。

接下来，需要定义`binging,gyp`文件，其内容如下所示：

```json
{
  "targets": [
    {
      "target_name": "hello",
      "sources": [
        "hello.c"
      ]
    }
  ]
}
```

`binging,gyp`是node-gyp的配置文件，如示例中所示，其中包括了`target_name`和`sources`。`target_name`定义了该Native包的名称，而`sources`定义了需要编译的文件。

接下来便可以使用`node-gyp`编译我们创建的Native模块。

```bash
$ node-gyp configure build
```

编译完后，将会在当前目录下产生一个`build`文件，其中包括了编译中生成的各个中间文件以及最后生成的`.node`文件，而`.node`文件本质上即一个动态的链接库（Node.js会调用`dlopen`函数用于加载`.node`文件）。我们接下来就将在js代码中引入生成的`.node`文件来调用`greeting`方法。

```js
const hello = require('./build/Release/hello.node');

console.log(hello.greeting());
```

在安装了`bindings`依赖以后，`const hello = require('./build/Release/hello.node');`可修改为`const hello = require('bindings')('hello');`。

最后，运行上面编写的index.js文件，即可输出在native扩展中定义的Hello N-API字符串。

```bash
$ node index.js
Hello N-API!
```

## 参考资料

1. [N-API | Node.js v12 Documentation](https://nodejs.org/dist/latest-v12.x/docs/api/n-api.html)
