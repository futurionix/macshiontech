---
title: Lodash throttle 源码解析与手写节流函数
permalink: lodash-throttle/
category: 中文
tags:
	- JavaScript
	- 函数节流
    - 前端面试
    - 防抖节流
---


Throttle（节流）：**在一定时间间隔内，控制函数的执行频率**。
👉 在一段时间内，最多只执行一次（有节制地执行）

## Lodash throttle 源码解析
Lodash 实现的 `throttle` 函数源码如下：
```javascript
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }
```

Lodash 的 `throttle` 函数看似简单，实际上**复用了 `debounce` 的实现**，通过传入特定参数来实现节流效果。

### 源码逐行解读

```javascript
function throttle(func, wait, options) {
  var leading = true,
      trailing = true;

  // 1. 参数校验：确保 func 是函数
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }

  // 2. 处理 options 配置
  if (isObject(options)) {
    // 如果 options 中指定了 leading，使用指定值（转布尔）；否则默认 true
    leading = 'leading' in options ? !!options.leading : leading;
    // 如果 options 中指定了 trailing，使用指定值（转布尔）；否则默认 true
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  // 3. 核心：调用 debounce，但传入 maxWait=wait
  return debounce(func, wait, {
    'leading': leading,      // 窗口开始时是否立即执行
    'maxWait': wait,         // 关键！最大等待时间 = wait（强制定期执行）
    'trailing': trailing     // 窗口结束时是否执行
  });
}
```

### 关键设计思想
1. 复用 debounce 实现
throttle 本质上是带 maxWait 参数的 debounce
debounce 会无限期推迟执行（只要持续触发）
加上 maxWait 后，即使持续触发，也会在 maxWait 毫秒后强制执行一次

2. maxWait 的作用
```
'maxWait': wait  // 这是 throttle 的核心
```
在 debounce 内部，maxWait 确保了：即使函数被频繁调用，也会在 wait 毫秒内至少执行一次
这正是"节流"的定义：限制最高频率为每 wait 毫秒一次

### 与 debounce 的区别

| | debounce | throttle |
|---|----------|----------|
| **目的** | 合并多次调用为最后一次 | 控制执行频率上限 |
| **典型场景** | 搜索框输入（等用户停止输入） | 滚动事件、窗口 resize |
| **实现** | 每次触发都重置定时器 | 每 `wait` 毫秒最多执行一次（`maxWait`）|
| **停止触发后** | 等待 `wait` 毫秒后执行一次 | 如果 `trailing=true`，窗口结束执行一次 |

### Lodash throttle 注释解析
频率限制：每 wait 毫秒最多执行一次
扩展方法：cancel 和 flush 提供更灵活的控制
参数机制：使用最后一次调用的参数，返回最后一次执行的结果
边界行为：leading/trailing 的协同逻辑避免不必要的重复执行
特殊情况：wait=0 + leading=false 的异步行为保证

Lodash 源码中的 `throttle` 注释如下：
```javascript
    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */
```

## 手写throttle函数

下面事应付前端面试 coding test 用的 throttle：
- 支持 `leading / trailing`
- 可读性优先，行为稳定，类型也比较干净
- 没有加 `cancel/flush` 之类的扩展

```ts
type ThrottleOptions = {
  leading?: boolean;
  trailing?: boolean;
};

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: ThrottleOptions = {}
) {
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0; // 上一次“真正执行”的时间点（leading 或 trailing）
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;

  const invoke = () => {
    lastCallTime = Date.now();
    timer = null;
    const args = lastArgs!;
    const ctx = lastThis;
    lastArgs = null;
    lastThis = null;
    fn.apply(ctx, args);
  };

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();

    if (lastCallTime === 0 && leading === false) {
      // trailing-only：首次不执行，只记录参数
      lastCallTime = now;
    }

    const remaining = wait - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;

    // 到点了：如果允许 leading，就立刻执行；并清理可能存在的 timer
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (leading) {
        invoke();
      } else if (trailing) {
        // leading=false 时，“到点”也不应立刻执行；交给 trailing 定时器（下面会安排）
        // 这里不做事
      }
      return;
    }

    // 还没到点：如果需要 trailing，并且当前没有定时器，则安排一次窗口结束执行
    if (trailing && !timer) {
      timer = setTimeout(() => {
        // 如果 leading=false,trailing=true：用最后一次参数执行
        // 如果 leading=true,trailing=true：窗口结束补一次（期间有更新 lastArgs）
        invoke();
      }, remaining);
    }
  };
}
```

使用例子（面试里常见）：

```ts
const throttled = throttle(
  (x: number) => console.log("run", x),
  1000,
  { leading: true, trailing: true }
);

throttled(1);
throttled(2);
throttled(3);
// 立即输出 run 1
// 约 1s 后输出 run 3（trailing 用最后一次参数）
```

在面试里可以这样解释要点：

* 闭包保存 `timer / lastCallTime / lastArgs`，让多次调用共享状态。
* `leading` 控制窗口开始是否立即执行。
* `trailing` 控制窗口结束是否用最后一次参数补执行。
* `remaining = wait - (now - lastCallTime)` 用于决定立刻执行还是排队。
