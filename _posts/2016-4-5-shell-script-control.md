---
layout: post
title: Shell Script条件及控制语句
date: 2016-4-5
categories: ShellScript
excerpt: Shell Script中的条件及控制语句，控制语句包括if、for、while、until、case、break、continue。
---

# 条件

## test与[命令
在Shellscript中，条件的测试判断可以通过`test`或`[`命令实现。如判断文件是否存在的语句可写为`if test -f test.sh`或`if [ -f test.sh ]`。使用`[`命令时符号与条件之间需要留出空格。下面列出字符串比较、算术比较、文件条件测试的一些用法。   

|字符串比较|结果|
|:---|:---------|
|string1 = string2|两个字符串相同时为真|
|string1 != string2|两个字符串不相同时为真|
|-n string|字符串不为空时为真|
|-z string|字符串为null（空串）时为真|

|算术比较|结果|
|:---|:------|
|expression1 -eq expression2|两个表达式相等时为真|
|expression1 -ne expression2|两个表达式不相等时为真|
|expression1 -gt expression2|expression1大于expression2时为真|
|expression1 -ge expression2|expression1大于等于expression2时为真|
|expression1 -lt expression2|expression1小于expression2时为真|
|expression1 -le expression2|expression1小于等于expression2时为真|
|! expression|表达式为假时结果为真|

|文件条件测试|结果|
|:---|:----------|
|-d file|文件是一个目录时为真|
|-e file|文件存在为真，通常使用-f|
|-f file|文件存在为真|
|-g file|文件的set-group-id为被设置则为真|
|-r file|文件可读为真|
|-s file|文件大小不为0为真|
|-u file|文件的set-user-id为被设置则为真|
|-w file|文件可读为真|
|-x file|文件可执行为真|

## AND 与 OR

### AND
在使用中可以需要满足多个条件，比如在if语句中如果需要同时满足三个条件就需要嵌套着写三个if，这样做会大大减低代码的美观性并增加嵌套的深度。所以在这样的条件下可以使用&&连接多个条件，如`statements1 && statements2 && statements3`。在程序运行的过程中，将会以从左往右的顺序执行，当其中某条语句为假时将不再判断后续的语句，整句的结果也为假。只有在所以语句都为真的情况下，整句的结果才为真。   

### OR
或的用法与与相似，它的用法为`statements1 || statements2 || statements3`。不同的于与需要当前条件为真才继续判断后续条件，或在使用中当某一个语句为真便不再继续判断后续的语句，整句的结果也为真。反之，只有所有的语句都为假时才为假。在使用中，与和或可以同时使用，如`statements1 || statements2 && statements3`，它表示statements1或statements2为真且statesments3为真的情况下为真。需要注意的是使用[]命令的情况下，&&与||需要放在[]之外。   

# 控制语句
控制语句包括条件语句、循环语句、转向语句等，Shellscript中的控制语句与其它语言大致相同，如`case`、`until`语句对应于C语言中的`switch`、`do...while`语句。

## 条件语句

### if
在Shellscript中，if语句的语法如下所示。   

```sh
if condition1
then
  statements1
elif condition2
  statements2
else
  statements3
fi
```

Condition即为执行的条件，其表达式可为上一节中的某种条件语句，当表达式为真时将执行对应的语句。Statements指满足条件的情况下将执行的语句，它不限制语句的数量，可以为一条或多条，也可以没有（在这种情况下需要使用:命令）。在Shellscript中，elif对应着C语言中的else if语句，其作用为当condition1不满足时将继续判断condition2，若其为真将执行statements2。else语句的作用为当上述条件都不满足时将执行该区域内的语句。最后，fi语句代表了该语句块结束。在使用中一个if语句块中，与之对应（即不计入嵌套的语句）的elif语句可以不使用或多次使用，else语句只能使用一次或不使用，而if与fi有仅可以出现一次。   

### case 
在Shellscript中，case语句对应着C语言中的switch语句，语法稍有不同但没有太大的影响。   

```sh
case variable in
  pattern1 [ | pattern3 ... ] ) statements1 ;;
  pattern2 [ | pattern4 ... ] ) statements2 ;;
esac
```

case语句将会进行模式匹配然后执行相关的语句。当variable的值为pattern1时，便会执行statements1语句块；当variable的值为pattern2时，便会执行statements2语句块。[]中的内容为可选条件，即可以多种情况执行同样的语句。在C语言的switch语句中有default，而case语句中没有default关键字。若要default功能可以使用通配符\*，即\*)，它的含义为任意字符窗。每个语句块都要以;;结尾。   

## 循环语句

### for

for语句可以循环处理一组值values，这组值可以是任意字符串的合集。for语句在使用上更类似于foreach循环。for循环的用法如下。   

```sh
for variable in values
do
  statements
done
```

下面使用一个例子以便更好的理解for语句。   

```sh
#!/bin/sh

for foo in bar fud 43
do
  echo $foo
done
exit 0
```

程序的运行结果为：   

```text
bar
fud
43
```

### while

while循环的用法与C语言中的while循环类似，当条件满足时便执行循环中的语句，直到条件不满足为止。   

```sh
while condition
do
  statements
done
```

### until

until循环相当于C语言中的do...while循环。与while循环不同，until循环会向执行循环内的语句，再判断条件是否成立。当条件满足，循环将会继续进行，否则将会跳出循环。   

```sh
until condition
do
  statements
done
```

## 转向语句

### break 与 continue
break与continue语句是在循环语句中使用的，其作用为当执行break时将不再执行循环中后续的代码且跳出循环，当执行continue时将不再执行此次循环中后续的代码进入下一次循环。与其他语言不同的是，在continue后可以带有一个数字，代表跳出的嵌套循环层数，但是使用这个将会提高程序的理解难度。   

