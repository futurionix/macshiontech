---
title: "Lodash debounce 源码解析"
permalink: lodash-debounce/
category: 中文
tags:
    - JavaScript
    - 函数防抖
---

Debounce（防抖）：**在一定时间间隔内，确保函数只执行一次**。
👉 多次调用后，只执行最后一次。
下面是 Lodash 里 debounce 的源码：
```javascript
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            timeWaiting = wait - timeSinceLastCall;

        return maxing
          ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
          : timeWaiting;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            clearTimeout(timerId);
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }
```

## 参数说明

Lodash 的 `debounce` 函数接收三个参数：

### 1. func (Function)
要进行防抖处理的函数。这是唯一的必传参数。

### 2. wait (Number)
延迟执行的毫秒数，默认为 `0`。表示在最后一次调用后，等待多久才真正执行 `func`。

### 3. options (Object)
可选的配置对象，包含以下属性：

#### options.leading (Boolean)
- 默认值：`false`
- 作用：是否在延迟开始前（leading edge）调用函数
- 场景：当设置为 `true` 时，第一次触发会立即执行，之后的调用会被防抖

#### options.maxWait (Number)
- 默认值：无
- 作用：`func` 允许被延迟的最大时间（毫秒）
- 场景：即使持续触发事件，也会在 `maxWait` 时间到达后强制执行一次，避免函数长时间不执行

#### options.trailing (Boolean)
- 默认值：`true`
- 作用：是否在延迟结束后（trailing edge）调用函数
- 场景：当设置为 `false` 时，延迟结束后不会执行函数

### 返回值
返回一个新的防抖函数，该函数具有两个附加方法：
- `cancel()`：取消延迟的 `func` 调用
- `flush()`：立即调用被延迟的 `func`

## 核心逻辑解析

让我们通过关键内部函数来理解 `debounce` 的实现原理：

### invokeFunc(time)
真正执行原始函数的地方，使用保存的 `lastArgs` 和 `lastThis` 来调用 `func`。

### leadingEdge(time)
处理"前缘触发"逻辑：
- 重置 `lastInvokeTime`
- 启动定时器
- 如果 `leading` 为 `true`，立即执行函数

### shouldInvoke(time)
判断是否应该执行函数，满足以下任一条件返回 `true`：
- 首次调用（`lastCallTime === undefined`）
- 距离上次调用已超过 `wait` 时间
- 系统时间倒退
- 达到 `maxWait` 限制

### trailingEdge(time)
处理"后缘触发"逻辑：
- 清除定时器
- 如果 `trailing` 为 `true` 且有缓存的参数，执行函数

### debounced()
返回给用户的防抖函数：
- 保存调用时的参数和上下文
- 判断是否需要执行
- 管理定时器的创建和更新

## 使用示例

```javascript
// 基础用法：延迟 300ms 执行
const debouncedSave = _.debounce(saveInput, 300);

// 立即执行第一次，之后防抖
const debouncedSearch = _.debounce(search, 500, { leading: true, trailing: false });

// 最多 1 秒必须执行一次
const debouncedScroll = _.debounce(handleScroll, 200, { maxWait: 1000 });

// 取消延迟执行
debouncedSave.cancel();

// 立即执行
debouncedSave.flush();
```

## 注意事项

1. **leading 和 trailing 同时为 true**：只有在 `wait` 期间多次调用时，函数才会在 trailing edge 执行
2. **wait 为 0 且 leading 为 false**：函数会延迟到下一个 tick 执行，类似 `setTimeout(func, 0)`
3. **maxWait 的作用**：防止函数长时间不执行，类似于 throttle 的效果

---

Lodash 的注释如下：

```javascript
    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
```

## JavaScript 核心知识点解析

前端面试经常会要求手写防抖函数，那么下面我们来分析下以上源码里包含的 JS 基础知识。

### 1. 闭包（Closure）

这是 `debounce` 实现的核心机制。外层函数 `debounce` 定义了多个变量：

```javascript
var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0;
```

内部函数（`invokeFunc`、`leadingEdge`、`debounced` 等）可以访问并修改这些外层变量。即使 `debounce` 函数已经执行完毕，返回的 `debounced` 函数仍然保持对这些变量的引用。

**为什么需要闭包？**
- 保存状态：记住上次调用的时间、参数、上下文等
- 私有变量：外部无法直接访问这些内部状态，只能通过返回的函数接口操作

```javascript
// 示例
const debouncedFn = debounce(someFunc, 300);
// lastArgs、timerId 等变量被"锁"在闭包中
// 每次调用 debouncedFn() 都会访问同一组变量
```

### 2. this 绑定与 apply/call

```javascript
function debounced() {
  lastThis = this;  // 保存调用时的 this
  // ...
}

function invokeFunc(time) {
  result = func.apply(thisArg, args);  // 使用 apply 调用原函数
}
```

**关键点**：
- `this` 的值取决于函数的调用方式
- `apply(thisArg, args)` 确保原函数以正确的上下文和参数执行
- 如果不保存 `this`，原函数可能无法访问正确的对象属性

```javascript
const obj = {
  name: 'test',
  save: debounce(function() {
    console.log(this.name);  // 需要正确的 this 才能访问 obj.name
  }, 300)
};
obj.save();  // 输出 'test'
```

### 3. arguments 对象

```javascript
function debounced() {
  lastArgs = arguments;  // 保存所有传入的参数
}
```

`arguments` 是类数组对象，包含函数调用时传入的所有参数。通过保存 `arguments`，即使防抖函数被多次调用，最终执行的始终是最后一次调用时的参数。

**注意**：箭头函数没有自己的 `arguments` 对象，这就是为什么 `debounced` 使用传统函数定义。

### 4. setTimeout 和 clearTimeout

```javascript
timerId = setTimeout(timerExpired, wait);  // 设置定时器
clearTimeout(timerId);  // 清除定时器
```

**防抖的核心机制**：
- 每次新调用都会清除旧的定时器，重新设置新的定时器
- 只有在 `wait` 时间内没有新调用，定时器才会触发执行

```javascript
// 简化版防抖实现
function simpleDebounce(func, wait) {
  let timerId;
  return function() {
    clearTimeout(timerId);  // 清除旧定时器
    timerId = setTimeout(() => {
      func.apply(this, arguments);
    }, wait);  // 设置新定时器
  };
}
```

### 5. 逻辑运算符

#### 双重否定 (!!)
```javascript
leading = !!options.leading;
```
将任何值转换为布尔类型：
- `!!undefined` → `false`
- `!!true` → `true`
- `!!1` → `true`
- `!!'string'` → `true`

#### 逻辑或 (||)
```javascript
wait = toNumber(wait) || 0;
```
提供默认值：如果 `toNumber(wait)` 为假值（`0`、`NaN`、`null` 等），使用 `0`。

#### 逻辑与 (&&)
```javascript
if (trailing && lastArgs) {
  return invokeFunc(time);
}
```
短路求值：只有两个条件都为真时才执行。

### 6. 三元运算符

```javascript
return maxing
  ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
  : timeWaiting;
```

简洁的条件判断，相当于：
```javascript
if (maxing) {
  return nativeMin(timeWaiting, maxWait - timeSinceLastInvoke);
} else {
  return timeWaiting;
}
```

### 7. 高阶函数

`debounce` 本身就是一个高阶函数：
- **接收函数作为参数**：`func` 参数
- **返回一个新函数**：`debounced` 函数

```javascript
function debounce(func, wait, options) {
  // ...
  return debounced;  // 返回函数
}
```

这种模式允许我们"包装"现有函数，添加额外的行为（如防抖）而不修改原函数。

### 8. 函数属性

JavaScript 中函数是对象，可以添加属性和方法：

```javascript
debounced.cancel = cancel;
debounced.flush = flush;
return debounced;
```

返回的 `debounced` 函数携带两个方法：
- `cancel()`：取消防抖
- `flush()`：立即执行

使用时：
```javascript
const debouncedFn = debounce(fn, 300);
debouncedFn();  // 正常调用
debouncedFn.cancel();  // 取消
debouncedFn.flush();  // 强制执行
```

### 9. 变量声明与作用域

```javascript
var lastArgs, lastThis, maxWait, result, timerId, lastCallTime;
```

使用 `var` 声明的变量：
- 函数作用域（不是块级作用域）
- 所有内部函数共享这些变量
- 变量提升到函数顶部

**现代写法建议**：使用 `let` 或 `const` 以获得块级作用域。

### 10. 类型检查

```javascript
if (typeof func != 'function') {
  throw new TypeError(FUNC_ERROR_TEXT);
}
```

防御性编程：在函数开始时验证参数类型，及早发现错误。

### 11. in 操作符

```javascript
maxing = 'maxWait' in options;
trailing = 'trailing' in options ? !!options.trailing : trailing;
```

`in` 操作符检查对象是否包含某个属性（包括继承的属性）：
- `'maxWait' in options` 检查 `options` 对象是否有 `maxWait` 属性
- 区别于 `options.maxWait !== undefined`，后者无法区分 `undefined` 值和不存在的属性

## 简化版实现

理解了核心概念后，我们可以实现一个简化版的 `debounce`：

```javascript
function simpleDebounce(func, wait) {
  let timerId;
  
  return function debounced(...args) {
    // 清除旧定时器
    clearTimeout(timerId);
    
    // 设置新定时器
    timerId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// 使用示例
const handleInput = simpleDebounce((e) => {
  console.log('搜索:', e.target.value);
}, 300);

input.addEventListener('input', handleInput);
```

## 与 Throttle（节流）的区别

- **Debounce（防抖）**：停止触发后才执行，强调"最后一次"
  - 场景：搜索框输入、窗口 resize、表单验证
  
- **Throttle（节流）**：持续触发时按固定频率执行，强调"间隔执行"
  - 场景：滚动加载、鼠标移动、进度条更新

```javascript
// Debounce: 停止输入 300ms 后搜索
input.addEventListener('input', debounce(search, 300));

// Throttle: 滚动时每 200ms 更新一次
window.addEventListener('scroll', throttle(updateProgress, 200));
```

## 总结

Lodash 的 `debounce` 实现综合运用了多个 JavaScript 核心概念：

1. **闭包**：保存状态
2. **this 和 apply**：正确的上下文绑定
3. **定时器**：延迟执行机制
4. **高阶函数**：函数式编程思想
5. **类型检查与防御性编程**：健壮的代码

掌握这些知识点，不仅能理解 `debounce` 的实现，也能在日常开发中写出更优雅、更可靠的代码。

---

**参考资料**：[Debouncing and Throttling Explained](https://css-tricks.com/debouncing-throttling-explained-examples/)