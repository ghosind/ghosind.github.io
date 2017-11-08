---
layout: post
title: WPF开发之限制输入的控件
date: 2017-11-08
categories: [WPF]
tags: [WPF]
excerpt: 通过事件及正则表达式构建一个只能输入限定格式的TextBox及ComboBox。
---

## 0xFF 题外话

在杭州报考了今年的研考，但是今天才发现杭州招生点昨天就结束了网上缴费，虽然还是在支付里面成功付了钱，但是还是有很大的可能不让考了。很是绝望，心情不好不想复习，就跑来写了这篇很久以前就准备写的博客。

## 0x00 前言

公司项目原来使用WinForms开发的GUI，进来的时候都是用的现成的方法实现限制输入的格式。虽然写的不是很好（原来使直接限制输入的字符），但也懒得去改那些代码。后来组里开始转用WPF来实现GUI，于是也就没有现成的可以直接用了。因为需求要求必须限定输入的字符，想着后面肯定也得用，就去决定自己去实现一下。

一开始想着WPF是否直接提供了相应的属性可以直接设置，但是找了一会没发现，网上很多方法也不适合。然后准备按之前WinForms实现的方法来实现，即通过过滤字符来实现，如限制了只能输入0-9的数字。但是在完成之后觉得还是不好，在允许输入小数点和负号后就可以输入例如1.1.1这样的字符串，而且WPF中判断字符比WinForms中稍微复杂一下，然后就决定用正则表达式来实现输入的限制。

## 0x01 实现过程

因为要将这个功能直接封装成一个控件供后面使用，就直接从System.Windows.Controls.TextBox继承，这样就不用去实现文本框的具体细节了，同理ComboBox也是直接继承自System.Windows.Controls.ComboBox。因为需求中需要满足多种限定条件，如输入浮点数等，于是就开放了一个属性供选择限定的类型，再根据选择的类型确定正则表达式。其实也可以直接开放正则表达式字符串属性可以设置，但是当时因为写好了又懒得改就没有再去修改了（其实不就是把private改public，懒死算了）。

```cs
if (RegexString == null)
{
    switch (ConstraintType)
    {
        case RestrictType.Int:    // 整数
            RegexString = @"^[-]?([\d]+)?$";
            break;
        case RestrictType.UInt:   // 非负整数
            RegexString = @"^[\d]+$";
            break;
        case RestrictType.Double:   // 浮点数
            RegexString = @"^[-]?([0-9]+)?[.]?([0-9]+)?$";
            break;
        case RestrictType.UDouble:    // 正非负浮点数
            RegexString = @"^[0-9]+[.]?([0-9]+)?$";
            break;
        case RestrictType.None:   // 无限制
        default:
            RegexString = "";
            break;
    }
}
```

有了正则表达式字符串后，就要开始实现限制输入了。最开始想通过TextChanged事件来实现，但是发现有些情况下的结果不理想（但是由于时间过长忘记了），于是就转用PreviewTextInput事件来实现。在PreviewTextInput事件的TextCompositionEventArgs参数中有Text这个属性，也就是当前输入的文本，不是全部的。而控件本身的Text属性中存储的就是输入前的文本，于是就想到`this.Text + e.Text`不就是完整的文本，马上就试了一下,发现是可行的。

```cs
if (!Regex.IsMatch(this.Text + e.Text, RegexString))
{
    e.Handled = true;
}
```

实现后试了几次后还是发现了一个问题，在非最末端输入会得到错误的结果，于是又开始尝试能不能得到输入的位置。于是在调试的过程中发现了TextBox的CareIndex属性（没错。。。我是在调试的时候看到的。。。懒得去看文档），于是就变成了这样。

```cs
if (!Regex.IsMatch(this.Text.Insert(this.CaretIndex, e.Text), RegexString))
{
    e.Handled = true;
}
```

然后很愉快地在任何地方输入都对了～但是还没完。。。发现在选中一段文字后输入（覆盖掉原来选中的）以及删除时还是会错啊。。。又在调试的时候找啊找，于是找到了SelectionLength属性，它是选中的文本长度。然后就很愉快地解决了这个问题。

```cs
private void PreviewTextInput(object sender, TextCompositionEventArgs e)
{
    try
    {
        if (!Regex.IsMatch(this.Text.Remove(this.CaretIndex, 
            this.Text.Length >= this.CaretIndex + this.SelectionLength ? this.SelectionLength : 0).
            Insert(this.CaretIndex, e.Text), RegexString))
        {
            e.Handled = true;
        }
    }
    catch (Exception)
    {
    }
}
```

然而，没愉快多久，问题又来了。PreviewTextInput在粘贴的时候不管用，而且需求要求不让用粘贴。查了一下资料后发现PreviewExecutedEvent可以实现拦截粘贴操作，但是TextBox不能直接添加这个事件，就找到了可以用AddHandler来添加，具体代码如下。

```cs
this.AddHandler(System.Windows.Input.CommandManager.PreviewExecutedEvent, 
    new ExecutedRoutedEventHandler(this.PreviewExecuted));  // 在构造函数中加入

private void PreviewExecuted(object sender, ExecutedRoutedEventArgs e)
{
    if (e.Command == ApplicationCommands.Paste)
    {
        e.Handled = true;
    }
}
```

至此，就差不多算是完成了一个可以限制输入的TextBox的控件。

## 0x02 实现ComboBox

实现ComboBox的过程中发现ComboBox没有CareIndex和Selection，但是在调试的时候发现ComboBox内部有个私有的TextBox，所以就用反射取得了TextBox。在取得ComboBox后基本实现方法就和TextBox一致了。

```cs
private void PreviewTextInput(object sender, System.Windows.Input.TextCompositionEventArgs e)
{
    PropertyInfo property = this.GetType().GetRuntimeProperties().
        Where(p => p.Name.Contains("TextBox")).FirstOrDefault();
    TextBox tb = property.GetValue(this) as TextBox;
    try
    {
        if (!Regex.IsMatch(this.Text.Remove(tb.CaretIndex, 
            this.Text.Length >= tb.CaretIndex + tb.SelectionLength ? tb.SelectionLength : 0).
            Insert(tb.CaretIndex, e.Text), RegexString))
        {
            e.Handled = true;
        }
    }
    catch (Exception)
    {
    }
}

private void PreviewExecuted(object sender, ExecutedRoutedEventArgs e)
{
    if (e.Command == ApplicationCommands.Paste)
    {
        e.Handled = true;
    }
}
```

## 0x03 结束语

在实现过程中查阅了不少资料，因为写这篇文章的时候离写这些控件已经很挺长一段时间了，也就忘了其中很多的过程了，在文章中也就没有写出来。这些控件的实现方法也有很多，我也只是写出了我自己实现的方式，也希望能够帮助到看到这篇文章的人。因为接触WPF的时间不长，可能会犯一些错误，也希望各位能够指出。