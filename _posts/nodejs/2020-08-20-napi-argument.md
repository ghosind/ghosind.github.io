---
layout: post
title: Node.js N-API获取方法参数
date: 2020-08-20
categories: [Node.js]
tags: [Node.js, Native, N-API]
excerpt: 在C/C++中通过N-API提供的方法获取Native方法被Node.js调用时所传递的参数。
---

在[上一章](https://www.ghosind.com/2020/02/17/native-module-napi)中提到了如何使用N-API进行Node.js Native模块的开发，介绍了使用`napi_create_string_utf8`方法创建一个UTF-8编码字符串并将其作为返回值返回。在本文中将继续这个话题介绍Node.js调用C/C++通过N-API实现的native方法时，获取其参数的操作。

## 实现目标

在本节中，将通过N-API实现一个`add`方法，其接受两个number类型的参数，并返回二者之和。`add`方法的实现等同于下列Javascript代码。

```js
function add(a, b) {
  if (arguments.length < 2) {
    throw new TypeError('Wrong number of arguments');
  }

  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Wrong arguments');
  }

  return a + b;
}
```

## 实现方式

在上一章中我们已经提到过使用N-API定义方法时接受的参数为`(napi_env, napi_callback_info)`，其中`napi_callback_info`为上下文的信息。我们可以通过`napi_get_cb_info`方法从`napi_callback_info`类型的参数中得到回调的参数等数据。`napi_get_cb_info`的函数原型如下：

```c
napi_status napi_get_cb_info(
  napi_env env,
  napi_callback_info cbinfo, // 传入回调函数的回调信息
  size_t *argc, // 作为入参传入`argv`数组的大小，并将接收实际的参数个数
  napi_value *argv, // 存放参数的buffer
  napi_value *this_arg, // Javascript中的`this`
  void** data // 接收数据指针
);
```

需要注意的是，若参数的个数大于请求的数量`argc`，将只复制`argc`的值所指定数量的参数只`argv`中。例如在下列代码中将请求的参数个数`argc`的值设为0，后续调用`napi_typeof`时将得到`napi_invalid_arg`错误，原因是未复制参数至buffer中。若实际的参数个数小于请求的数量，将复制全部的参数并使用`napi_value`类型所表示的`undefined`值填充。

在了解了`napi_get_cb_info`方法后，我们就可以使用它来获取`add`方法的参数了。对于`add`方法，需要两个数值类型的参数，所以在调用`napi_get_cb_info`方法前，我们声明了`size_t`类型的`argc`变量用于存放我们需要的参数个数以及接收实际的参数个数，并声明了`napi_value`类型的数组`argv`用于存放参数的值，其长度为我们需要的参数个数的值。

```c
size_t argc = 2;
napi_value argv[2];

status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
```

在调用`napi_get_cb_info`后，我们还需要对参数进行验证。在上文中Javascript实现中，我们对参数个数以及参数的类型进行了检查，下面我们就来看看如何在N-API中实现。

首先，我们需要判断实际传递的参数个数。在实际参数数量小于2个的情况下，我们需要使用`napi_throw_type_error`方法抛出一个`TypeError`错误。其代码实现如下：

```c
if (argc < 2) {
  napi_throw_type_error(env, NULL, "Wrong number of arguments.");
  return NULL; // 不再继续执行后续代码
}
```

`napi_throw_type_error`方法将抛出一个`TypeError`类型的错误。该方法相当于使用`throw new TypeError()`语句。`napi_throw_type_error`的函数原型如下：

```c
napi_status napi_throw_type_error(
  napi_env env,
  const char *code, // 可选的错误代码
  const char *msg // C语言类型的错误信息字符串
);
```

然后，我们需要验证传入的参数是否为我们需要的`number`类型。在N-API中，我们可以通过`napi_typeof`方法获取指定对象的类型，其函数原型如下：

```c
napi_status napi_typeof(
  napi_env env,
  napi_value value, // 将要获取类型的Javascript值
  napi_valuetype *result // Javascript值的类型
);
```

在调用`napi_typeof`方法后，可以通过其出参`result`得到其`napi_valuetype`类型所表示的对象类型。`napi_valuetype`是一个用于描述`napi_value`所存放Javascript对象类型的枚举值，其定义为：

```c
typedef enum {
  napi_undefined,
  napi_null,
  napi_boolean,
  napi_number,
  napi_string,
  napi_symbol,
  napi_object,
  napi_function,
  napi_external,
  napi_bigint
} napi_valuetype;
```

`napi_valuetype`对应了ECMAScript标准中定义的`Boolean`、`Null`、`Undefined`、`Number`、`BigInt`、`String`、`Symbol`和`Object`八种数据类型，以及函数对应的`Function`类型。另外，`napi_valuetype`还包括了一个`napi_external`类型，其表示没有任何属性也没有任何原型的对象。

`napi_typeof`与Javascript中的`typeof`操作符也有一些区别，例如当值为`null`时，`typeof`操作符将返回`object`而`napi_typeof`将得到`napi_null`。

对于我们上文中需要实现的验证功能，我们可以使用下面的方式实现：

```c
napi_valuetype valuetype;

napi_typeof(env, argv[0], &valuetype);

if (valuetype != napi_number) {
  // ...
  // 处理非数值类型的情况
}
```

接下来，我们需要获取参数的值，并计算得到二者之和。因为从传入的参数是Javascript值类型，为了能够进行计算，我们需要获取其对应在C/C++中的类型的值。N-API提供了包括`napi_get_value_int32`、`napi_get_value_double`、`napi_get_value_bool`、`napi_get_value_string_utf8`等在内的方法以便获取不同类型的值。在`add`方法中传入的参数为`number`类型，以及为了可以处理浮点数的情况，所以在这里我们主要使用`napi_get_value_double`方法获取参数对应`double`类型的值。`napi_get_value_double`方法的函数原型如下：

```c
napi_status napi_get_value_double(
  napi_env env,
  napi_value value, // 获取的Javascript值
  double *result // 用于保存对应的double类型值
);
```

在上文中我们已经通过`napi_typeof`方法获取并验证参数是否为`number`类型，若未进行验证直接调用`napi_get_value_double`且Javascript值不为`number`类型时，它将返回`napi_number_expected`状态表示错误。我们可以使用下面的代码实现获取`double`类型值的操作：

```c
double value1, value2;

napi_get_value_double(env, argv[0], &value1);
napi_get_value_double(env, argv[1], &value2);
```

最后，我们只需要计算出两个`double`类型值之和，创建其对应的Javascript值并返回即可。我们使用的是`double`类型进行计算，所以在创建Javascript值时需要使用`napi_create_double`方法。`napi_create_double`对应的函数原型如下：

```c
napi_status napi_create_double(
  napi_env env,
  double value, // double类型的值
  napi_value *result // 保存创建的Javascript值
);
```

若在计算的时候不是将其转换为`double`类型，N-API也提供了`napi_create_uint32`、`napi_create_int64`、`napi_create_bigint_int64`等方法，可以根据具体的需求选择不同的类型。另外，在前文中我们也提到过使用`napi_create_string_utf8`创建UTF-8编码的字符串。除此之外，N-API还有`napi_create_object`、`napi_create_array`等用于创建对象、数组等类型的方法，大家可以到[N-API文档](https://nodejs.org/dist/latest-v14.x/docs/api/n-api.html)中查看并选择需要的方法。

```c
napi_value sum;

napi_create_double(env, value1 + value2, sum);

// return sum;
```

在完成上面的所有操作后，我们只需按照上一章所说的完成`exports`的定义以及模块的注册后，便可以在js代码中使用定义的`add`方法。

## 完整的add方法代码

```c
napi_value add(napi_env env, napi_callback_info info) {
  napi_status status;

  size_t argc = 2;
  napi_value argv[2];

  status = napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  assert(status == napi_ok);

  if (argc < 2) {
    napi_throw_type_error(env, NULL, "Wrong number of arguments.");
    return NULL;
  }

  napi_valuetype valueType1, valueType2;

  status = napi_typeof(env, argv[0], &valueType1);
  assert(status == napi_ok);

  status = napi_typeof(env, argv[1], &valueType2);
  assert(status == napi_ok);

  if (valueType1 != napi_number || valueType2 != napi_number) {
    napi_throw_type_error(env, NULL, "Wrong arguments");
    return NULL;
  }

  double value1, value2;

  status = napi_get_value_double(env, argv[0], &value1);
  assert(status == napi_ok);

  status = napi_get_value_double(env, argv[1], &value2);
  assert(status == napi_ok);

  napi_value sum;
  status = napi_create_double(env, value1 + value2, &sum);
  assert(status == napi_ok);

  return sum;
}

// 模块注册等
```

## 结束语

同样，我们需要按之前章节中所提到的创建构建所需的`binding.gyp`文件，并运行`node-gyp configure build`命令编译。在编译之后，在Javascript代码中引入得到的`.node`文件并调用定义的`add`方法即可：

```js
const { add } = require('./build/Release/add.node');

console.log(add(1, 2));
// 3
```

在本文中，我们介绍了如何在C/C++中获取从Javascript传递来的参数，以及获取参数对应在C/C++中类型的值。在后续的文章中我们将会继续介绍如何在C/C++中调用通过参数传递的Javascript方法，向其传递参数并接收其返回值。

## 参考资料

- [N-API - Node.js v14.8.0 Documentation](https://nodejs.org/dist/latest-v14.x/docs/api/n-api.html)
- [function arguments - node-addon-examples](https://github.com/nodejs/node-addon-examples/tree/master/2_function_arguments/napi)
