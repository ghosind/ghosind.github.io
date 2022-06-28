---
layout: post
title: Golang html/template包实现跳过HTML转义
date: 2022-06-28
categories: [Go]
tags: [Go, template, html]
excerpt: 在使用Golang标准库的html/template包时，通过自定义函数实现避免制定区域文本进行转义，从而实现传入HTML文本进行渲染的功能。
---

使用golang标准库中的`html/template`时，在默认情况下渲染模版时为了安全等原因，会将字符串中的部分符号进行转义。例如在下面的例子中，我们定义了一个简单的HTML模版：

```html
<body>
  <main>
    {{.Content}}
  </main>
</body>
```

我们直接使用默认设置，并传入带有HTML标签的文本进行渲染：

```go
// content内容为上面的模版
// var content string
tpl, err := template.New("example").Parse(content)
if err != nil {
  // ...
}
buf := new(bytes.Buffer)
tpl.Execute(buf, map[string]string{
  "Content": "<p>Hello, world!</p>",
})
```

在这样的情况下，上述内容将被转义并最终得到下面的文本，而非期望中嵌入带有HTML标签的文本：

```html
<body>
  <main>
    &lt;p&gt;Hello World&lt;/p&gt;
  </main>
</body>
```

## 传递template.HTML类型值避免转义

为了实现避免转义的效果，可以在执行`Execute()`方法前，将带有HTML标签的文本转为`template.HTML`类型：

```go
tpl.Execute(buf, map[string]any{
  "Content": template.HTML("<p>Hello, world!</p>"),
})
```

使用这种方法实现最为简单，但缺陷是在不修改代码的情况下该字段将固定转换为`template.HTML`类型，使用较为不灵活。

## 注册自定义转义处理函数

除了在执行`Execute()`前将文本转换类型外，还可以使用模版的`Funcs()`方法注册自定义函数。

为了实现我们避免转义HTML文本的效果，我们先要定义一个函数用于处理将字符串转为`template.HTML`类型。例如我们定一个名为`unescapeHTML`的函数：

```go
func unescapeHTML(s string) template.HTML {
  return template.HTML(s)
}
```

在定义转义处理函数后，我们需要使用`Funcs()`将其注册到模版中。需要注意，注册自定义函数需要在调用`Parse()`前进行。在注册时我们需要定义一个函数标识符，并在模版文本中使用。在下面例子中我们使用了名为`unescapeHTML`的函数标识符。

```go
tpl, err := template.
  New("example").
  Funcs(template.FuncMap{
    "unescapeHTML": unescapeHTML,
  }).
  Parse(content)
if err != nil {
  // ...
}
buf := new(bytes.Buffer)
tpl.Execute(buf, map[string]string{
  "Content": "<p>Hello, world!</p>",
})
```

另外在模版文本内容中，对于需要避免转义的部分需要使用上面定义的函数。为了进行对比，我们在示例中对两个区域分别使用了`unescapeHTML`进行标记以及不使用任何修改：

```html
<body>
  <main>
    <div>{{unescapeHTML .Content}}</div>
    <div>{{.Content}}</div>
  </main>
</body>
```

执行后我们将得到：

```html
<body>
  <main>
    <div><p>Hello, world!</p></div>
    <div>&lt;p&gt;Hello, world!&lt;/p&gt;</div>
  </main>
</body>
```

## 写在最后

使用模版的自定义函数自定义转义处理方法虽相对将为复杂一些，但是在后续使用中较为灵活，只需要修改模版文件即可，而无需修改实现代码。

`html/template`同样也提供了例如`template.JS`、`template.CSS`等类型，用于Javascript或是CSS的处理。

`html/template`包默认进行转义很大程度上避免了一些安全性的问题，例如潜在的XSS攻击等。在实际使用中，进行不转义处理后将存在安全性方面的风险，对于风险较高的使用场合需要另外考虑这方面的处理。
