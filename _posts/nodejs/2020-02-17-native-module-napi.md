---
layout: post
title: 通过N-API使用C/C++开发Node.js Native模块
date: 2020-02-17
last_modified_at: 2020-03-25
categories: [Node.js]
tags: [Node.js, Native, N-API]
excerpt: 本文主要简单介绍Node.js中的N-API模块，并以一个简单的例子展示如何通过N-API使用C/C++开发Node.js Native模块。
---

## 什么是N-API

N-API为开发者提供了一套C/C++ API用于开发Node.js的Native扩展模块。从Node.js 8.0.0开始，N-API以实验性特性作为Node.js本身的一部分被引入，并且从Node.js 10.0.0开始正式全面支持N-API。

## Hello N-API

本文将使用一个简单的模块作为示例介绍N-API。我们将编写一个`hello`模块，其中包括一个返回`Hello N-API!`字符串的方法`greeting`。其实现的功能相当于下列Javascript代码：

```js
const greeting = () => {
  return 'Hello N-API!';
}

module.exports = {
  greeting,
};
```

### greeting方法定义

首先，我们需要定义`greeting`方法，并返回值为`Hello N-API!`的字符串。为了使用N-API提供的接口及类型定义，我们需要引入`node_api.h`头文件。使用N-API定义的方法需要满足`napi_callback`类型，其定义为：

```c
typedef napi_value (*napi_callback)(napi_env env, napi_callback_info info);
```

`napi_callback`是使用N-API开发的Native函数的函数指针类型，其接受类型分别为`napi_env`以及`napi_callback_info`的两个参数，并返回类型为`napi_value`的值。`greeting`方法中涉及到的几个类型定义及其用途如下：

- `napi_value`类型是一个用于表示Javascript值的指针
- `napi_env`类型用于存储Javascript虚拟机的上下文
- `napi_callback_info`类型用于调用回调函数时，传递调用时的上下文信息

我们定义的`greeting`方法如下：

```c
napi_value greeting(napi_env env, napi_callback_info info) {
  napi_status status;
  napi_value word;
  char *str = "Hello N-API!";

  status = napi_create_string_utf8(env, str, strlen(str), &word);

  assert(status == napi_ok);

  return word;
}
```

在`greeting`方法中，我们通过`napi_create_string_utf8`函数创建了值为`"Hello N-API!"`的Javascript字符串对象，并将其作为该方法的返回值返回。`napi_create_string_utf8`用于创建一个UTF-8类型的字符串对象，其值来自于参数传递的UTF-8编码字符串，函数原型如下：

```c
napi_status napi_create_string_utf8(napi_env env,
  const char *str,
  size_t length,
  napi_value* result
);
```

- `env`：传递当前VM的上下文信息
- `str`：UTF-8编码的字符序列
- `length`：字符序列`str`的长度
- `result`：用于表示创建的Javascript字符串对象的指针

`napi_create_string_utf8`返回一个`napi_status`类型的值，当其值为`napi_ok`时代表完成字符串对象的创建。如示例中代码所示，我们在调用`napi_create_string_utf8`后，便使用`assert`判断其返回值是否为`napi_ok`。

`napi_status`是一个用于指示N-API中状态的枚举类型，其值可参考[napi_status](#https://nodejs.org/dist/latest-v12.x/docs/api/n-api.html#n_api_napi_status)。

### 模块注册

在完成了`greeting`方法后，我们还需要注册我们的`hello`模块。N-API通过`NAPI_MODULE(modname, regfunc)`宏进行模块的注册。其接受两个参数，分别为模块名及模块初始化函数。模块初始化函数需要满足下列函数签名：

```c
napi_value (*)(napi_env env, napi_value exports);
```

在模块的初始化中，我们可以定义模块需要暴露的方法及属性。我们的模块初始化函数如下所示：

```c
napi_value init(napi_env env, napi_value exports) {
  napi_status status;
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

  status = napi_define_properties(env, exports, 1, &descriptor);
  assert(status == napi_ok);

  return exports;
}

NAPI_MODULE(hello, init);
```

在我们的的初始化函数中，需要在模块的`exports`对象中定义`greeting`属性。在定义属性之前，我们需要创建一个`napi_property_descriptor`类型的属性描述符，该类型的定义如下：

```c
typedef struct {
  const char* utf8name;
  napi_value name;

  napi_callback method;
  napi_callback getter;
  napi_callback setter;
  napi_value value;

  napi_property_attributes attributes;
  void* data;
} napi_property_descriptor;
```

对于本文示例中需要使用的属性值描述如下所示，关于`napi_property_descriptor`的更多描述可参考[napi_property_descriptor](#https://nodejs.org/dist/latest-v12.x/docs/api/n-api.html#n_api_napi_property_descriptor)。

- `utf8name`：UTF-8编码的字符序列
- `name`：由Javascript对象表示的字符串或者Symbol

`utf8name`以及`name`二者中必须且只能有一个被提供，其代表属性的名称。

- `method`：将该属性设置为表示一个Javascript方法（function）
- `attributes`：属性的行为控制标志，示例中使用了默认的`napi_default`值，更多描述可参考[napi_property_attributes](#https://nodejs.org/dist/latest-v12.x/docs/api/n-api.html#n_api_napi_property_attributes)

我们需要定义的`greeting`属性是一个方法，所以我们所创建的属性描述符主要传递了`utf8name`以及`method`属性。

在创建属性描述符后，便需要将其在模块的`exports`对象中定义，使Javascript代码能够访问。对象属性的定义使用了`napi_define_properties`函数，它可以快速的为一个对象定义指定数量的属性。该函数定义为：

```c
napi_status napi_define_properties(napi_env env,
  napi_value object,
  size_t property_count,
  const napi_property_descriptor *properties
);
```

- `object`：需要定义属性的Javascript对象
- `property_count`：属性数量
- `properties`：属性描述符数组

同样，`napi_define_properties`也返回了一个`napi_status`类型的值表示函数调用是否成功。

最后，我们只需要在模块初始化函数中返回`exports`对象，并通过`NAPI_MODULE(hello, init)`注册`hello`模块。到此为止，我们的`hello`模块便编写完成了。

## 模块编译

Native模块的构建可选择`node-gyp`或者`cmake.js`，二者的使用需要安装C/C++工具链，本文选择了`node-gyp`作为示例的构建工具。`node-gyp`是基于Google的`gyp`工具开发，它除了必要的C/C++编译器以外，还需要安装Python以及make工具。对于Windows用户，使用`node-gyp`需要安装Python并通过npm安装`windows-build-tools`（`npm install --global --production windows-build-tools`）。

接下来，需要定义`binding,gyp`文件。`binding,gyp`是node-gyp的JSON类型配置文件，文中示例程序使用的`binding.gyp`内容如下所示：

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

如示例所示，`binding,gyp`文件中定义了`targets`，它定义了一组gyp能生成的目标。`targets`中定义了一个对象，其包括了`target_name`和`sources`两个属性。`target_name`定义了该Native包的名称，`sources`定义了需要编译的文件。

对于gyp文件的更多配置，可参考[nodejs/node-gyp](#https://github.com/nodejs/node-gyp)、[GYP User Documentation](#https://gyp.gsrc.io/docs/UserDocumentation.md)以及[GYP Input Format Reference](#https://gyp.gsrc.io/docs/InputFormatReference.md)。

接下来便可以使用`node-gyp`构建示例中编写的Native模块。

```bash
$ node-gyp configure build
```

在完成构建后，将会在当前目录下产生一个`build`文件，其中包括了生成的各个中间文件以及`.node`文件。`.node`文件本质上即一个动态的链接库，Node.js会调用`dlopen`函数用于加载`.node`文件。

## 测试

在构建Native模块后，就将在js代码中引入生成的`.node`文件，并调用上文模块中定义`greeting`方法。

```js
const hello = require('./build/Release/hello.node');

console.log(hello.greeting());
```

运行该程序，将得到下面的输出结果：

```bash
$ node index.js
Hello N-API!
```

若安装了`bindings`依赖，便可将`const hello = require('./build/Release/hello.node');`修改为`const hello = require('bindings')('hello');`。

```js
const hello = require('bindings')('hello');

console.log(hello.greeting());
```

## 结束语

对于Node.js Native扩展模块的开发，除了使用N-API提供的API以外，还可选择[nodejs/nan](#https://github.com/nodejs/nan)或者[nodejs/node-addon-api](#https://github.com/nodejs/node-addon-api)。

N-API提供的接口为纯C的风格，对于C++开发者可选用[node-addon-api](#https://github.com/nodejs/node-addon-api)，其在N-API的基础上提供了C++对象模型以及异常处理。

## 参考资料

1. [N-API - Node.js v12 Documentation](https://nodejs.org/dist/latest-v12.x/docs/api/n-api.html)
2. [node-addon-examples - GitHub](https://github.com/nodejs/node-addon-examples/tree/master/1_hello_world/napi)
