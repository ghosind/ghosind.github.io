---
layout: post
title: X86汇编标志寄存器
date: 2021-01-31
last_modified_at: 2021-07-07
categories: [Assembly]
tags: [FLAGS寄存器, Assembly, X86汇编]
excerpt: 简单记录X86汇编EFLAGS标志寄存器中各标志位的作用。
---

FLAGS标志寄存器由一组状态标志、一个控制标志以、一组系统标志以及一部分保留未使用的位所组成。其状态标志用于表示逻辑或算术运算的结果，系统标志提供给操作系统使用。

![EFLAGS寄存器](/assets/images/assembly/248b0f00/eflags.png)

在16位汇编中，我们可以使用16位`FLAGS`标志寄存器，即上图中的低16位。32位汇编中使用32位`EFLAGS`寄存器，即上图中展示的32位内容。64位汇编使用64位的`RFLAGS`寄存器，其低32位即`EFLAGS`，高32位保留暂未使用。

通过`LAHF`、`SAHF`、`PUSHF`、`PUSHFD`、`POPF`以及`POPFD`指令，可以通过栈或`EAX`寄存器获得标志值，并可以使用位操作指令（如`BT`、`BTS`、`BTC`、`BTR`）等指令测试指定状态。

## 状态标志

状态标志用于指示算术运算（例如使用`ADD`、`SUB`、`MUL`、`DIV`等指令）后的结果，它们包括包括有以下几个标志：

- `CF`：进位标志（Carry flag）是标志寄存器的第0位，又被称之为`CY`，当其被设置时表示运算结果的最高有效位发生进位或借位的情况，并在无符号整数的运算中表示运算的溢出状态。
- `PF`：奇偶校验标志（Parity flag）是标志寄存器的第2位，当其被设置表示结果中包含偶数个值为1的位，否则表示结果中包含奇数个值位1的位。
- `AF`：辅助进位标志（Auxiliary carry flag）是标志寄存器的第4位，当其被设置表示在算术运算中低三位发生进位或借位（例如`AL`向`AH`进位或借位）或BCD码算术运算中发生进位或借位的情况。
- `ZF`：零标志（Zero flag）是标志寄存器的第6位，当其被设置时运算的结果是否等于0，否则不等于0。
- `SF`：符号标志（Sign flag）是标志寄存器的第7位，当其被设置时表示结果为负数，否则为正数。
- `OF`：溢出标志（Overflow flag）是标志寄存器的第11位，当其被设置时代表运算结果溢出，即结果超出了能表达的最大范围。

状态标志中，只有`CF`标志能被直接通过`STC`、`CLC`以及`CMC`指令修改。

## 控制标志

- `DF`：方向标志（Direction flag）是标志寄存器的第10位，用于指示串操作指令地址的变化方向。当其被设置时，存储器由自高向低方向变化，否则相反。`STD`与`CLD`指令分别用于设置、清除`DF`标志的值。

## 系统标志

- `TF`：陷阱标志（Trap flag）是标志寄存器的第8位，当其被设置时将开启单步调试模式。在其被设置的情况下，每个指令被执行后都将产生一个调试异常，以便于观察指令执行后的情况。
- `IF`：中断标志（Interrupt flag）是标志寄存器的第9位，当其被设置时表示CPU可响应可屏蔽中断（maskable interrupt）。
- `IOPL`：I/O特权级别标志（I/O privilege level flag）是标志寄存器的第12位以及第13位，表示当其程序或任务的I/O权限级别。I/O权限级别为0～3范围之间的值，通常一般用户程序I/O特权级别为0。当前运行程序的CPL（current privilege level）必须小于等于IOPL，否则将发生异常。
- `NT`：嵌套任务（Nested task flag）是标志寄存器的第14位，用于控制中断返回指令`IRET`的执行方式。若被设置则将通过中断的方式执行返回，否则通过常规的堆栈的方式执行。在执行`CALL`指令、中断或异常处理时，处理器将会设置该标志。
- `RF`：恢复标志（Resume flag）是标志寄存器的第16位，用于控制处理器对调试异常的响应。若其被设置则会暂时禁止断点指令产生的调试异常，其复位后断点指令将会产生异常。
- `VM`：虚拟8086模式标志（Virtual 8086 mode flag）是标志寄存器的第17位，当其被设置表示启用虚拟8086模式（在保护模式下模拟实模式），否则退回到保护模式工作。
- `AC`：对齐检查标志（Alignment check (or access control) flag）是标志寄存器的第18位。当该标志位被设置且`CR0`寄存器中的`AM`位被设置时，将对用户态下对内存引用进行对齐检查，在存在未对齐的操作数时产生异常。
- `VIF`：虚拟中断标志（Virtual interrupt flag）是标志寄存器的第19位，为`IF`标志的虚拟映象。该标志与`VIP`标志一起，且在`CR4`寄存器中`VME`或`PVI`位被设置且`IOPL`小于3时，处理器才将识别该标志。
- `VIP`：虚拟中断挂起标志（Virtual interrupt pending flag）是标志寄存器的第20位，其被设置表示有一个中断被挂起（等待处理），否则表示没有等待处理的中断。该标志通常与`VIF`标志搭配一起使用。
- `ID`：ID标志（Identification flag）是标志寄存器的第21位，通过修改该位的值可以测试是否支持`CPUID`指令。

## 参考资料

- Intel® 64 and IA-32 Architectures Software Developer’s Manual, Volume 1: Basic Architecture.
- Intel® 64 and IA-32 Architectures Software Developer’s Manual, Volume 3A: System Programming Guide.
- Daniel Kusswurm. *Modern X86 Assembly Language Programming, 32-bit, 64-bit, SSE, and AVX*.
