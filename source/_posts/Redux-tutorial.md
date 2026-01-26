---
title: Redux tutorial
date: 2020-11-18 18:12:36
tags: 
- React
- Redux
categories: English
---

## Tutorial 0 - introduction
Why this tutorial?
While trying to learn Redux, I realized that I had accumulated incorrect knowledge about flux through
articles I read and personal experience. I don't mean that articles about flux are not well written
but I just didn't grasp concepts correctly. In the end, I was just applying documentation of different
flux frameworks (Reflux, Flummox, FB Flux) and trying to make them match with the theoretical concept I read
about (actions / actions creators, store, dispatcher, etc).
<!-- more -->
Only when I started using Redux did I realize that flux is more simple than I thought. This is all
thanks to Redux being very well designed and having removed a lot of "anti-boilerplate features" introduced
by other frameworks I tried before. I now feel that Redux is a much better way to learn about flux
than many other frameworks. That's why I want now to share with everyone, using my own words,
flux concepts that I am starting to grasp, focusing on the use of Redux.

You may have seen this diagram representing the famous unidirectional data flow of a flux application:

```
                 _________               ____________               ___________
                |         |             |            |             |           |
                | Action  |------------▶| Dispatcher |------------▶| callbacks |
                |_________|             |____________|             |___________|
                     ▲                                                   |
                     |                                                   |
                     |                                                   |
 _________       ____|_____                                          ____▼____
|         |◀----|  Action  |                                        |         |
| Web API |     | Creators |                                        |  Store  |
|_________|----▶|__________|                                        |_________|
                     ▲                                                   |
                     |                                                   |
                 ____|________           ____________                ____▼____
                |   User       |         |   React   |              | Change  |
                | interactions |◀--------|   Views   |◀-------------| events  |
                |______________|         |___________|              |_________|
```

In this tutorial we'll gradually introduce you to concepts of the diagram above. But instead of trying
to explain this complete diagram and the overall flow it describes, we'll take each piece separately and try to
understand why it exists and what role it plays. In the end you'll see that this diagram makes perfect sense
once we understand each of its parts.

But before we start, let's talk a little bit about why flux exists and why we need it...
Let's pretend we're building a web application. What are all web applications made of?
1) Templates / html = View
2) Data that will populate our views = Models
3) Logic to retrieve data, glue all views together and to react accordingly to user events,
   data modifications, etc. = Controller

This is the very classic MVC that we all know about. But it actually looks like concepts of flux,
just expressed in a slightly different way:
- Models look like stores
- user events, data modifications and their handlers look like
  "action creators" -> action -> dispatcher -> callback
- Views look like React views (or anything else as far as flux is concerned)

So is flux just a matter of new vocabulary? Not exactly. But vocabulary DOES matter, because by introducing
these new terms we are now able to express more precisely things that were regrouped under
various terminologies... For example, isn't a data fetch an action? Just like a click is also an action?
And a change in an input is an action too... Then we're all already used to issuing actions from our
applications, we were just calling them differently. And instead of having handlers for those
actions directly modify Models or Views, flux ensures all actions go first through something called
a dispatcher, then through our stores, and finally all watchers of stores are notified.

To get more clarity how MVC and flux differ, we'll
take a classic use-case in an MVC application:
In a classic MVC application you could easily end up with:
1) User clicks on button "A"
2) A click handler on button "A" triggers a change on Model "A"
3) A change handler on Model "A" triggers a change on Model "B"
4) A change handler on Model "B" triggers a change on View "B" that re-renders itself

Finding the source of a bug in such an environment when something goes wrong can become quite challenging
very quickly. This is because every View can watch every Model, and every Model can watch other Models, so
basically data can arrive from a lot of places and be changed by a lot of sources (any views or any models).

Whereas when using flux and its unidirectional data flow, the example above could become:
1) user clicks on button "A"
2) a handler on button "A" triggers an action that is dispatched and produces a change on Store "A"
3) since all other stores are also notified about the action, Store B can react to the same action too
4) View "B" gets notified by the change in Stores A and B, and re-renders

See how we avoid directly linking Store A to Store B? Each store can only be
modified by an action and nothing else. And once all stores have replied to an action,
views can finally update. So in the end, data always flows in one way:
    action -> store -> view -> action -> store -> view -> action -> ...

Just as we started our use case above from an action, let's start our tutorial with
actions and action creators.

## Tutorial 1 - simple-action-creator

We started to talk a little about actions in the introduction but what exactly are those "action creators"
and how are they linked to "actions"?

It's actually so simple that a few lines of code can explain it all!

The action creator is just a function...

```javascript
var actionCreator = function() {
    // ...that creates an action (yeah, the name action creator is pretty obvious now) and returns it
    return {
        type: 'AN_ACTION'
    }
}
```

So is that all? yes.

However, one thing to note is the format of the action. This is kind of a convention in flux
that the action is an object that contains a "type" property. This type allows for further
handling of the action. Of course, the action can also contain other properties to
pass any data you want.

We'll also see later that the action creator can actually return something other than an action,
like a function. This will be extremely useful for async action handling (more on that
in dispatch-async-action.js).

We can call this action creator and get an action as expected:

```javascript
console.log(actionCreator())
// Output: { type: 'AN_ACTION' }
```

Ok, this works but it does not go anywhere...
What we need is to have this action be sent somewhere so that
anyone interested could know that something happened and could act accordingly.
We call this process "Dispatching an action".

To dispatch an action we need... a dispatch function ("Captain obvious").
And to let anyone interested know that an action happened, we need a mechanism to register
"handlers". Such "handlers" to actions in traditional flux application are called stores and
we'll see in the next section how they are called in Redux.

So far here is the flow of our application:
ActionCreator -> Action

Read more about actions and action creators here:

http://redux.js.org/docs/recipes/ReducingBoilerplate.html

## Tutorial 02 - about-state-and-meet-redux

Sometimes the actions that we'll handle in our application will not only inform us
that something happened but also tell us that data needs to be updated.

This is actually quite a big challenge in any app.
Where do I keep all the data regarding my application along its lifetime?
How do I handle modification of such data?
How do I propagate modifications to all parts of my application?

Here comes Redux.

Redux (https://github.com/reactjs/redux) is a "predictable state container for JavaScript apps"

Let's review the above questions and reply to them with
Redux vocabulary (flux vocabulary too for some of them):

Where do I keep all the data regarding my application along its lifetime?

    You keep it the way you want (JS object, array, Immutable structure, ...).
    Data of your application will be called state. This makes sense since we're talking about
    all the application's data that will evolve over time, it's really the application's state.
    But you hand it over to Redux (Redux is a "state container", remember?).

How do I handle data modifications?

    Using reducers (called "stores" in traditional flux).
    A reducer is a subscriber to actions.
    A reducer is just a function that receives the current state of your application, the action,
    and returns a new state modified (or reduced as they call it)

How do I propagate modifications to all parts of my application?

    Using subscribers to state's modifications.

Redux ties all this together for you.

To sum up, Redux will provide you:

    1) a place to put your application state
    2) a mechanism to dispatch actions to modifiers of your application state, AKA reducers
    3) a mechanism to subscribe to state updates

The Redux instance is called a store and can be created like this:

```javascript
import { createStore } from 'redux'
var store = createStore()
```

But if you run the code above, you'll notice that it throws an error:

    Error: Invariant Violation: Expected the reducer to be a function.

That's because createStore expects a function that will allow it to reduce your state.

Let's try again

```javascript
import { createStore } from 'redux'
var store = createStore(() => {})
```

Seems good for now...

## Tutorial 03 - simple-reducer

Now that we know how to create a Redux instance that will hold the state of our application
we will focus on those reducer functions that will allow us to transform this state.

A word about reducer VS store:

As you may have noticed, in the flux diagram shown in the introduction, we had "Store", not
"Reducer" like Redux is expecting. So how exactly do Store and Reducer differ?

It's more simple than you could imagine: A Store keeps your data in it while a Reducer doesn't.
So in traditional flux, stores hold state in them while in Redux, each time a reducer is
called, it is passed the state that needs to be updated. This way, Redux's stores became
"stateless stores" and were renamed reducers.

As stated before, when creating a Redux instance you must give it a reducer function...

```javascript
import { createStore } from 'redux'
var store_0 = createStore(() => {})
```

... so that Redux can call this function on your application state each time an action occurs.
Giving reducer(s) to createStore is exactly how Redux registers the action "handlers" (read reducers) we
were talking about in section 01_simple-action-creator.

Let's put some log in our reducer

```javascript
var reducer = function (...args) {
    console.log('Reducer was called with args', args)
}
var store_1 = createStore(reducer)

// Output: Reducer was called with args [ undefined, { type: '@@redux/INIT' } ]
```

Did you see that? Our reducer is actually called even if we didn't dispatch any action...
That's because to initialize the state of the application,
Redux actually dispatches an init action ({ type: '@@redux/INIT' })

When called, a reducer is given those parameters: (state, action)
It's then very logical that at an application initialization, the state, not being
initialized yet, is "undefined"

But then what is the state of our application after Redux sends its "init" action?

## Tutorial 04 - get-state

How do we retrieve the state from our Redux instance?

```javascript
import { createStore } from 'redux'

var reducer_0 = function (state, action) {
    console.log('reducer_0 was called with state', state, 'and action', action)
}

var store_0 = createStore(reducer_0)
// Output: reducer_0 was called with state undefined and action { type: '@@redux/INIT' }
```

To get the state that Redux is holding for us, you call getState

```javascript
console.log('store_0 state after initialization:', store_0.getState())

// Output: store_0 state after initialization: undefined
```

So the state of our application is still undefined after the initialization? Well of course it is,
our reducer is not doing anything... Remember how we described the expected behavior of a reducer in
"about-state-and-meet-redux"?

    "A reducer is just a function that receives the current state of your application, the action,
    and returns a new state modified (or reduced as they call it)"

Our reducer is not returning anything right now so the state of our application is what
reducer() returns, hence "undefined".

Let's try to send an initial state of our application if the state given to reducer is undefined:

```javascript
var reducer_1 = function (state, action) {
    console.log('reducer_1 was called with state', state, 'and action', action)
    if (typeof state === 'undefined') {
        return {}
    }

    return state;
}

var store_1 = createStore(reducer_1)
// Output: reducer_1 was called with state undefined and action { type: '@@redux/INIT' }

console.log('store_1 state after initialization:', store_1.getState())
// Output: store_1 state after initialization: {}
```

As expected, the state returned by Redux after initialization is now {}

There is however a much cleaner way to implement this pattern thanks to ES6:

```javascript
var reducer_2 = function (state = {}, action) {
    console.log('reducer_2 was called with state', state, 'and action', action)

    return state;
}

var store_2 = createStore(reducer_2)
// Output: reducer_2 was called with state {} and action { type: '@@redux/INIT' }

console.log('store_2 state after initialization:', store_2.getState())
// Output: store_2 state after initialization: {}
```
You've probably noticed that since we've used the default parameter on state parameter of reducer_2,
we no longer get undefined as state's value in our reducer's body.

Let's now recall that a reducer is only called in response to an action dispatched and
let's fake a state modification in response to an action type 'SAY_SOMETHING'

```javascript
var reducer_3 = function (state = {}, action) {
    console.log('reducer_3 was called with state', state, 'and action', action)

    switch (action.type) {
        case 'SAY_SOMETHING':
            return {
                ...state,
                message: action.value
            }
        default:
            return state;
    }
}

var store_3 = createStore(reducer_3)
// Output: reducer_3 was called with state {} and action { type: '@@redux/INIT' }

console.log('store_3 state after initialization:', store_3.getState())
// Output: store_3 state after initialization: {}
```

Nothing new in our state so far since we did not dispatch any action yet. But there are few
important things to pay attention to in the last example:

    0) I assumed that our action contains a type and a value property. The type property is mostly
       a convention in flux actions and the value property could have been anything else.
    1) You'll often see the pattern involving a switch to respond appropriately
       to an action received in your reducers
    2) When using a switch, NEVER forget to have a "default: return state" because
       if you don't, you'll end up having your reducer return undefined (and lose your state).
    3) Notice how we returned a new state made by merging current state with { message: action.value },
       all that thanks to this awesome ES7 notation (Object Spread): { ...state, message: action.value }
    4) Note also that this ES7 Object Spread notation suits our example because it's doing a shallow
       copy of { message: action.value } over our state (meaning that first level properties of state
       are completely overwritten - as opposed to gracefully merged - by first level property of
       { message: action.value }). But if we had a more complex / nested data structure, you might choose
       to handle your state's updates very differently:
    
       - using Immutable.js (https://facebook.github.io/immutable-js/)
       - using Object.assign (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
       - using manual merge
       - or whatever other strategy that suits your needs and the structure of your state since
         Redux is absolutely NOT opinionated on this (remember, Redux is a state container).

Now that we're starting to handle actions in our reducer let's talk about having multiple reducers and
combining them.

## Tutorial 05 - combine-reducers

We're now starting to get a grasp of what a reducer is...

```javascript
var reducer_0 = function (state = {}, action) {
    console.log('reducer_0 was called with state', state, 'and action', action)

    switch (action.type) {
        case 'SAY_SOMETHING':
            return {
                ...state,
                message: action.value
            }
        default:
            return state;
    }
}
```

... but before going further, we should start wondering what our reducer will look like when
we'll have tens of actions:

```javascript
var reducer_1 = function (state = {}, action) {
    console.log('reducer_1 was called with state', state, 'and action', action)

    switch (action.type) {
        case 'SAY_SOMETHING':
            return {
                ...state,
                message: action.value
            }
        case 'DO_SOMETHING':
            // ...
        case 'LEARN_SOMETHING':
            // ...
        case 'HEAR_SOMETHING':
            // ...
        case 'GO_SOMEWHERE':
            // ...
        // etc.
        default:
            return state;
    }
}
```

It becomes quite evident that a single reducer function cannot hold all our
application's actions handling (well it could hold it, but it wouldn't be very maintainable...).

Luckily for us, Redux doesn't care if we have one reducer or a dozen and it will even help us to
combine them if we have many!

Let's declare 2 reducers
```javascript
var userReducer = function (state = {}, action) {
    console.log('userReducer was called with state', state, 'and action', action)

    switch (action.type) {
        // etc.
        default:
            return state;
    }
}
var itemsReducer = function (state = [], action) {
    console.log('itemsReducer was called with state', state, 'and action', action)

    switch (action.type) {
        // etc.
        default:
            return state;
    }
}
```

I'd like you to pay special attention to the initial state that was actually given to
each reducer: userReducer got an initial state in the form of a literal object ({}) while
itemsReducer got an initial state in the form of an array ([]). This is just to
make clear that a reducer can actually handle any type of data structure. It's really
up to you to decide which data structure suits your needs (an object literal, an array,
a boolean, a string, an immutable structure, ...).

With this new multiple reducer approach, we will end up having each reducer handle only
a slice of our application state.

But as we already know, createStore expects just one reducer function.

So how do we combine our reducers? And how do we tell Redux that each reducer will only handle
a slice of our state?

It's fairly simple. We use Redux combineReducers helper function. combineReducers takes a hash and
returns a function that, when invoked, will call all our reducers, retrieve the new slice of state and
reunite them in a state object (a simple hash {}) that Redux is holding.

Long story short, here is how you create a Redux instance with multiple reducers:

```javascript
import { createStore, combineReducers } from 'redux'

var reducer = combineReducers({
    user: userReducer,
    items: itemsReducer
})

// Output:
// userReducer was called with state {} and action { type: '@@redux/INIT' }
// userReducer was called with state {} and action { type: '@@redux/PROBE_UNKNOWN_ACTION_9.r.k.r.i.c.n.m.i' }
// itemsReducer was called with state [] and action { type: '@@redux/INIT' }
// itemsReducer was called with state [] and action { type: '@@redux/PROBE_UNKNOWN_ACTION_4.f.i.z.l.3.7.s.y.v.i' }

var store_0 = createStore(reducer)

// Output:
// userReducer was called with state {} and action { type: '@@redux/INIT' }
// itemsReducer was called with state [] and action { type: '@@redux/INIT' }
```

As you can see in the output, each reducer is correctly called with the init action @@redux/INIT.
But what is this other action? This is a sanity check implemented in combineReducers
to assure that a reducer will always return a state != 'undefined'.

Please note also that the first invocation of init actions in combineReducers share the same purpose
as random actions (to do a sanity check).

```javascript
console.log('store_0 state after initialization:', store_0.getState())

// Output:
// store_0 state after initialization: { user: {}, items: [] }
```

It's interesting to note that Redux handles our slices of state correctly,
the final state is indeed a simple hash made of the userReducer's slice and the itemsReducer's slice:

```javascript
{
    user: {}, // {} is the slice returned by our userReducer
    items: [] // [] is the slice returned by our itemsReducer
}
```

Since we initialized the state of each of our reducers with a specific value ({} for userReducer and
[] for itemsReducer) it's no coincidence that those values are found in the final Redux state.

By now we have a good idea of how reducers will work. It would be nice to have some
actions being dispatched and see the impact on our Redux state.

## Tutorial 06 - dispatch-action

So far we've focused on building our reducer(s) and we haven't dispatched any of our own actions.
We'll keep the same reducers from our previous tutorial and handle a few actions:

```javascript

var userReducer = function (state = {}, action) {
    console.log('userReducer was called with state', state, 'and action', action)

    switch (action.type) {
        case 'SET_NAME':
            return {
                ...state,
                name: action.name
            }
        default:
            return state;
    }
}
var itemsReducer = function (state = [], action) {
    console.log('itemsReducer was called with state', state, 'and action', action)

    switch (action.type) {
        case 'ADD_ITEM':
            return [
                ...state,
                action.item
            ]
        default:
            return state;
    }
}

import { createStore, combineReducers } from 'redux'

var reducer = combineReducers({
    user: userReducer,
    items: itemsReducer
})
var store_0 = createStore(reducer)

console.log("\n", '### It starts here')
console.log('store_0 state after initialization:', store_0.getState())
// Output:
// store_0 state after initialization: { user: {}, items: [] }
```

Let's dispatch our first action... Remember in 'simple-action-creator' we said:

    "To dispatch an action we need... a dispatch function." Captain obvious

The dispatch function we're looking for is provided by Redux and will propagate our action
to all of our reducers! The dispatch function is accessible through the Redux
instance property "dispatch"

To dispatch an action, simply call:

```javascript
store_0.dispatch({
    type: 'AN_ACTION'
})

// Output:
// userReducer was called with state {} and action { type: 'AN_ACTION' }
// itemsReducer was called with state [] and action { type: 'AN_ACTION' }
```

Each reducer is effectively called but since none of our reducers care about this action type,
the state is left unchanged:

```javascript
console.log('store_0 state after action AN_ACTION:', store_0.getState())
// Output: store_0 state after action AN_ACTION: { user: {}, items: [] }
```

But, wait a minute! Aren't we supposed to use an action creator to send an action? 

We could indeed use an actionCreator but since all it does is return an action it would not bring anything more to this example. But for the sake of future difficulties let's do it the right way according to
flux theory. And let's make this action creator send an action we actually care about:

```javascript
var setNameActionCreator = function (name) {
    return {
        type: 'SET_NAME',
        name: name
    }
}

store_0.dispatch(setNameActionCreator('bob'))

// Output:
// userReducer was called with state {} and action { type: 'SET_NAME', name: 'bob' }
// itemsReducer was called with state [] and action { type: 'SET_NAME', name: 'bob' }

console.log('store_0 state after action SET_NAME:', store_0.getState())

// Output:
// store_0 state after action SET_NAME: { user: { name: 'bob' }, items: [] }
```

We just handled our first action and it changed the state of our application!

But this seems too simple and not close enough to a real use-case. For example,
what if we'd like do some async work in our action creator before dispatching
the action? We'll talk about that in the next tutorial.

So far here is the flow of our application
ActionCreator -> Action -> dispatcher -> reducer

## Tutorial 07 - dispatch-async-action-1

We previously saw how we can dispatch actions and how those actions will modify
the state of our application thanks to reducers.

But so far we've only considered synchronous actions or, more exactly, action creators
that produce an action synchronously: when called an action is returned immediately.

Let's now imagine a simple asynchronous use-case:
1) user clicks on button "Say Hi in 2 seconds"
2) When button "A" is clicked, we'd like to show message "Hi" after 2 seconds have elapsed
3) 2 seconds later, our view is updated with the message "Hi"

Of course this message is part of our application state so we have to save it
in Redux store. But what we want is to have our store save the message
only 2 seconds after the action creator is called (because if we were to update our state
immediately, any subscriber to state's modifications - like our view - would be notified right away
and would then react to this update 2 seconds too soon).

If we were to call an action creator like we did until now...

```javascript
import { createStore, combineReducers } from 'redux'

var reducer = combineReducers({
    speaker: function (state = {}, action) {
        console.log('speaker was called with state', state, 'and action', action)

        switch (action.type) {
            case 'SAY':
                return {
                    ...state,
                    message: action.message
                }
            default:
                return state;
        }
    }
})
var store_0 = createStore(reducer)

var sayActionCreator = function (message) {
    return {
        type: 'SAY',
        message
    }
}

console.log("\n", 'Running our normal action creator:', "\n")

console.log(new Date());
store_0.dispatch(sayActionCreator('Hi'))

console.log(new Date());
console.log('store_0 state after action SAY:', store_0.getState())

// Output (skipping initialization output):
//     Sun Aug 02 2015 01:03:05 GMT+0200 (CEST)
//     speaker was called with state {} and action { type: 'SAY', message: 'Hi' }
//     Sun Aug 02 2015 01:03:05 GMT+0200 (CEST)
//     store_0 state after action SAY: { speaker: { message: 'Hi' } }

```
... then we see that our store is updated immediately.

What we'd like instead is an action creator that looks a bit like this:

```javascript
var asyncSayActionCreator_0 = function (message) {
    setTimeout(function () {
        return {
            type: 'SAY',
            message
        }
    }, 2000)
}
```

But then our action creator would not return an action, it would return "undefined". So this is not
quite the solution we're looking for.

Here's the trick: instead of returning an action, we'll return a function. And this function will be the
one to dispatch the action when it seems appropriate to do so. But if we want our function to be able to
dispatch the action it should be given the dispatch function. Then, this should look like this:

```javascript
var asyncSayActionCreator_1 = function (message) {
    return function (dispatch) {
        setTimeout(function () {
            dispatch({
                type: 'SAY',
                message
            })
        }, 2000)
    }
}
```

Again you'll notice that our action creator is not returning an action, it is returning a function.
So there is a high chance that our reducers won't know what to do with it. But you never know, so let's
try it out and find out what happens...

## Tutorial 08 - dispatch-async-action-2

Let's try to run the first async action creator that we wrote in dispatch-async-action-1.js.

```javascript
import { createStore, combineReducers } from 'redux'

var reducer = combineReducers({
    speaker: function (state = {}, action) {
        console.log('speaker was called with state', state, 'and action', action)

        switch (action.type) {
            case 'SAY':
                return {
                    ...state,
                    message: action.message
                }
            default:
                return state;
        }
    }
})
var store_0 = createStore(reducer)

var asyncSayActionCreator_1 = function (message) {
    return function (dispatch) {
        setTimeout(function () {
            dispatch({
                type: 'SAY',
                message
            })
        }, 2000)
    }
}

console.log("\n", 'Running our async action creator:', "\n")
store_0.dispatch(asyncSayActionCreator_1('Hi'))

// Output:
//     ...
//     /Users/classtar/Codes/redux-tutorial/node_modules/redux/node_modules/invariant/invariant.js:51
//         throw error;
//               ^
//     Error: Invariant Violation: Actions must be plain objects. Use custom middleware for async actions.
//     ...
```

It seems that our function didn't even reach our reducers. But Redux has been kind enough to give us a
tip: "Use custom middleware for async actions.". It looks like we're on the right path but what is this
"middleware" thing?

Just to reassure you, our action creator asyncSayActionCreator_1 is well-written and will work as expected
as soon as we've figured out what middleware is and how to use it.

## Tutorial 09 - middleware

We left dispatch-async-action-2 with a new concept: "middleware". Somehow middleware should help us
to solve async action handling. So what exactly is middleware?

Generally speaking middleware is something that goes between parts A and B of an application to
transform what A sends before passing it to B. So instead of having:
A -----> B
we end up having
A ---> middleware 1 ---> middleware 2 ---> middleware 3 --> ... ---> B

How could middleware help us in the Redux context? Well it seems that the function that we are
returning from our async action creator cannot be handled natively by Redux but if we had a
middleware between our action creator and our reducers, we could transform this function into something
that suits Redux:

action ---> dispatcher ---> middleware 1 ---> middleware 2 ---> reducers

Our middleware will be called each time an action (or whatever else, like a function in our
async action creator case) is dispatched and it should be able to help our action creator
dispatch the real action when it wants to (or do nothing - this is a totally valid and
sometimes desired behavior).

In Redux, middleware are functions that must conform to a very specific signature and follow
a strict structure:

```javascript
/*
    var anyMiddleware = function ({ dispatch, getState }) {
        return function(next) {
            return function (action) {
                // your middleware-specific code goes here
            }
        }
    }
*/
```

As you can see above, a middleware is made of 3 nested functions (that will get called sequentially):
1) The first level provides the dispatch function and a getState function (if your
    middleware or your action creator needs to read data from state) to the 2 other levels
2) The second level provides the next function that will allow you to explicitly hand over
    your transformed input to the next middleware or to Redux (so that Redux can finally call all reducers).
3) the third level provides the action received from the previous middleware or from your dispatch
    and can either trigger the next middleware (to let the action continue to flow) or process
    the action in any appropriate way.

Those of you who are trained to functional programming may have recognized above an opportunity
to apply a functional pattern: currying (if you aren't, don't worry, skipping the next 10 lines
won't affect your Redux understanding). Using currying, you could simplify the above function like that:

```javascript
/*
    // "curry" may come from any functional programming library (lodash, ramda, etc.)
    var thunkMiddleware = curry(
        ({dispatch, getState}, next, action) => (
            // your middleware-specific code goes here
        )
    );
*/
```

The middleware we have to build for our async action creator is called a thunk middleware and
its code is provided here: https://github.com/gaearon/redux-thunk.
Here is what it looks like (with function body translated to es5 for readability):

```javascript
var thunkMiddleware = function ({ dispatch, getState }) {
    // console.log('Enter thunkMiddleware');
    return function(next) {
        // console.log('Function "next" provided:', next);
        return function (action) {
            // console.log('Handling action:', action);
            return typeof action === 'function' ?
                action(dispatch, getState) :
                next(action)
        }
    }
}
```

To tell Redux that we have one or more middlewares, we must use one of Redux's
helper functions: applyMiddleware.

"applyMiddleware" takes all your middlewares as parameters and returns a function to be called
with Redux createStore. When this last function is invoked, it will produce "a higher-order
store that applies middleware to a store's dispatch".

(from https://github.com/reactjs/redux/blob/master/src/applyMiddleware.js)

Here is how you would integrate a middleware into your Redux store:

```javascript
import { createStore, combineReducers, applyMiddleware } from 'redux'

const finalCreateStore = applyMiddleware(thunkMiddleware)(createStore)
// For multiple middlewares, write: applyMiddleware(middleware1, middleware2, ...)(createStore)

var reducer = combineReducers({
    speaker: function (state = {}, action) {
        console.log('speaker was called with state', state, 'and action', action)

        switch (action.type) {
            case 'SAY':
                return {
                    ...state,
                    message: action.message
                }
            default:
                return state
        }
    }
})

const store_0 = finalCreateStore(reducer)

// Output:
//     speaker was called with state {} and action { type: '@@redux/INIT' }
//     speaker was called with state {} and action { type: '@@redux/PROBE_UNKNOWN_ACTION_s.b.4.z.a.x.a.j.o.r' }
//     speaker was called with state {} and action { type: '@@redux/INIT' }
```

Now that we have our middleware-ready store instance, let's try again to dispatch our async action:

```javascript
var asyncSayActionCreator_1 = function (message) {
    return function (dispatch) {
        setTimeout(function () {
            console.log(new Date(), 'Dispatch action now:')
            dispatch({
                type: 'SAY',
                message
            })
        }, 2000)
    }
}

console.log("\n", new Date(), 'Running our async action creator:', "\n")

store_0.dispatch(asyncSayActionCreator_1('Hi'))

// Output:
//     Mon Aug 03 2015 00:01:20 GMT+0200 (CEST) Running our async action creator:
//     Mon Aug 03 2015 00:01:22 GMT+0200 (CEST) 'Dispatch action now:'
//     speaker was called with state {} and action { type: 'SAY', message: 'Hi' }
```

Our action is correctly dispatched 2 seconds after our call the async action creator!

Just for your curiosity, here is how a middleware to log all actions that are dispatched, would
look like:

```javascript
function logMiddleware ({ dispatch, getState }) {
    return function(next) {
        return function (action) {
            console.log('logMiddleware action received:', action)
            return next(action)
        }
    }
}
```

Same below for a middleware to discard all actions that are dispatched (not very useful as is
but with a bit of more logic it could selectively discard a few actions while passing others
to next middleware or Redux):

```javascript
function discardMiddleware ({ dispatch, getState }) {
    return function(next) {
        return function (action) {
            console.log('discardMiddleware action received:', action)
        }
    }
}
```

Try to modify finalCreateStore call above by using the logMiddleware and / or the discardMiddleware
and see what happens...

For example, using:

    const finalCreateStore = applyMiddleware(discardMiddleware, thunkMiddleware)(createStore)

should make your actions never reach your thunkMiddleware and even less your reducers.

See http://redux.js.org/docs/introduction/Ecosystem.html#middleware, section Middleware, to
see other middleware examples.

Let's sum up what we've learned so far:
1) We know how to write actions and action creators
2) We know how to dispatch our actions
3) We know how to handle custom actions like asynchronous actions thanks to middlewares

The only missing piece to close the loop of Flux application is to be notified about
state updates in order to react to them (by re-rendering our components for example).

So how do we subscribe to our Redux store updates?

## Tutorial 10 - state-subscriber
We're close to having a complete Flux loop but we still miss one critical part:
```
 _________      _________       ___________
|         |    | Change  |     |   React   |
|  Store  |----▶ events  |-----▶   Views   |
|_________|    |_________|     |___________|
```
Without it, we cannot update our views when the store changes.

Fortunately, there is a very simple way to "watch" over our Redux store's updates:

```javascript
/*
    store.subscribe(function() {
        // retrieve latest store state here
        // Ex:
        console.log(store.getState());
    })
*/
```

Yeah... So simple that it almost makes us believe in Santa Claus again.

Let's try this out:

```javascript
import { createStore, combineReducers } from 'redux'

var itemsReducer = function (state = [], action) {
    console.log('itemsReducer was called with state', state, 'and action', action)

    switch (action.type) {
        case 'ADD_ITEM':
            return [
                ...state,
                action.item
            ]
        default:
            return state;
    }
}

var reducer = combineReducers({ items: itemsReducer })
var store_0 = createStore(reducer)

store_0.subscribe(function() {
    console.log('store_0 has been updated. Latest store state:', store_0.getState());
    // Update your views here
})

var addItemActionCreator = function (item) {
    return {
        type: 'ADD_ITEM',
        item: item
    }
}

store_0.dispatch(addItemActionCreator({ id: 1234, description: 'anything' }))

// Output:
//     ...
//     store_0 has been updated. Latest store state: { items: [ { id: 1234, description: 'anything' } ] }
```

Our subscribe callback is correctly called and our store now contains the new item that we added.

Theoretically speaking we could stop here. Our Flux loop is closed, we understood all concepts that make
Flux and we saw that it is not that much of a mystery. But to be honest, there is still a lot to talk
about and a few things in the last example were intentionally left aside to keep the simplest form of this
last Flux concept:

- Our subscriber callback did not receive the state as a parameter, why?
- Since we did not receive our new state, we were bound to exploit our closured store (store_0) so this
    solution is not acceptable in a real multi-modules application...
- How do we actually update our views?
- How do we unsubscribe from store updates?
- More generally speaking, how should we integrate Redux with React?

We're now entering a more "Redux inside React" specific domain.

It is very important to understand that Redux is by no means bound to React. It is really a
"Predictable state container for JavaScript apps" and you can use it in many ways, a React
application just being one of them.

In that perspective we would be a bit lost if it wasn't for react-redux 

(https://github.com/reactjs/react-redux).

Previously integrated inside Redux (before 1.0.0), this repository holds all the bindings we need to simplify
our life when using Redux inside React.

Back to our "subscribe" case... Why exactly do we have this subscribe function that seems so simple but at
the same time also seems to not provide enough features?

Its simplicity is actually its power! Redux, with its current minimalist API (including "subscribe") is
highly extensible and this allows developers to build some crazy products like the Redux DevTools

(https://github.com/gaearon/redux-devtools).

But in the end we still need a "better" API to subscribe to our store changes. That's exactly what react-redux
brings us: an API that will allow us to seamlessly fill the gap between the raw Redux subscribing mechanism
and our developer expectations. In the end, you won't need to use "subscribe" directly. Instead you will
use bindings such as "provide" or "connect" and those will hide from you the "subscribe" method.

So yeah, the "subscribe" method will still be used but it will be done through a higher order API that
handles access to Redux state for you.

We'll now cover those bindings and show how simple it is to wire your components to Redux's state.

## Tutorial 11 - Provider-and-connect

This is the final tutorial and the one that will show you how to bind together Redux and React.

To run this example, you will need a browser.

All explanations for this example are inlined in the sources inside ./11_src/src/.

Once you've read the lines below, start with 11_src/src/server.js.

To build our React application and serve it to a browser, we'll use:
- A very simple node HTTP server (https://nodejs.org/api/http.html)
- The awesome Webpack (http://webpack.github.io/) to bundle our application,
- The magic Webpack Dev Server (http://webpack.github.io/docs/webpack-dev-server.html)
    to serve JS files from a dedicated node server that allows for files watch
- The incredible React Hot Loader http://gaearon.github.io/react-hot-loader/ (another awesome project of Dan Abramov - just in case, he is Redux's author) to have a crazy
    DX (Developer experience) by having our components live-reload in the browser
    while we're tweaking them in our code editor.

An important point for those of you who are already using React: this application is built
upon React 0.14.

I won't detail Webpack Dev Server and React Hot Loader setup here since it's done pretty
well in React Hot Loader's docs.

```javascript
import webpackDevServer from './11_src/src/webpack-dev-server'
// We request the main server of our app to start it from this file.
import server from './11_src/src/server'

// Change the port below if port 5050 is already in use for you.
// if port equals X, we'll use X for server's port and X+1 for webpack-dev-server's port
const port = 5050

// Start our Webpack dev server...
webpackDevServer.listen(port)
// ... and our main app server.
server.listen(port)

console.log(`Server is listening on http://127.0.0.1:${port}`)
```

## Tutorial 12 - final-words

There is actually more to Redux and react-redux than what we showed you with this tutorial. For example,
concerning Redux, you may be interested in bindActionCreators,to produce a hash of action creators
already bound to dispatch

 (http://redux.js.org/docs/api/bindActionCreators.html).

We hope we've given you the keys to better understand Flux and to see more clearly
how Flux implementations differ from one another - especially how Redux stands out ;).

Where to go from here?

The official Redux documentation is really awesome and exhaustive so you should not hesitate to
refer to it from now on: http://redux.js.org/

You also can find this tutorial in: https://github.com/happypoulp/redux-tutorial

Have fun with React and Redux!

