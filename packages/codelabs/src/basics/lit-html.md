# lit-html & lit-element: Basics

## Introduction

In this codelab, you will learn the basics of building web components with lit-element and lit-html.

[lit-html](https://github.com/Polymer/lit-html) is a javascript library for writing HTML templates, and then efficiently render and re-render those templates together with data to create and update DOM.

[lit-element](https://github.com/Polymer/lit-element) makes it easy to use lit-html with web components, and manage properties and styles for your components.

**What you need:**

- Intermediate knowledge of HTML and Javascript
- Basic knowledge of web components.
- A web browser that supports Web Components: Firefox, Safari, Chrome or any Chromium-based browser.

**What you'll learn:**

- Creating web components with lit-element
- Templating with lit-html
- Repeating templates
- Conditional rendering
- Handling events
- Managing data
- Creating child components

**How it works**
This codelab will go step by step, explaining each code change. At the bottom of each section, there is a "View final result" button where you can see the final code result you should end up with. The codelab is sequential, so results from the previous step carry on to the next step.

At the bottom of each step, there is a final code snippet to make sure you're still on the right track or to help you when you get stuck.

## Setup

In this codelab, we will build a simple todo app, a great showcase for learning the basics of lit-html and lit-element.

You can follow this codelab using anything that can display a simple HTML page. We recommend using an [online code editor like jsbin](https://jsbin.com/?html,output), but you could also create a basic html page using your IDE.

To get started, create a simple webpage:

```html
<!DOCTYPE html>
<html>
  <body>
    My todo app
  </body>
</html>
```

If you run this in the browser and see the message on the screen, you're good to go.

## lit-element setup

lit-element takes care of most of the boilerplate when writing components, providing a great developer experience while staying close to the browser platform. It does not require any build step to run in the browser, and it's only 7kb. This makes it an ideal lightweight choice.

lit-element is written and distributed as es modules, this means we can import it using the browser's native module loader. Let's create a module script, and import LitElement from a CDN:

```html
<!DOCTYPE html>

<html>
  <body>
    <script type="module">
      import { LitElement } from 'https://unpkg.com/lit-element?module';
    </script>
  </body>
</html>
```

Make sure you add `type="module"` to the script tag.

Next, we need to define our web component. When writing a vanilla web component we would extend from `HTMLElement`. With lit-element we need to import and extend from `LitElement`, which itself is an extension of `HTMLElement`.

```js
class TodoApp extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    console.log('lit element connected');
  }
}

customElements.define('todo-app', TodoApp);
```

We defined the tag name for our element as `todo-app`, now we need to add this to the HTML of our page:

```html
<todo-app></todo-app>
```

If you run this in the browser you should see `lit element connected` logged to the terminal.

<aside class="notice">
  Because LitElement also does some work in the `connectedCallback`, we must always call `super.connectedCallback()`. This is a common source of confusion, so make sure to remember!
</aside>

Now that we have defined our element, we can start adding a template. lit-element uses lit-html to handle the templating. lit-html works by writing HTML inside of [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) which are strings that can span multiple lines:

```js
const template = `
 <h1>Hello world</h1>
`;
```

In order to create an actual `lit-html` template, we prefix the template literal with a special HTML tag:

```js
import { html } from 'https://unpkg.com/lit-element?module';

const template = html`
  <h1>Hello world</h1>
`;
```

This is a native browser feature called [tagged template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates), where the `html` tag is a function which returns the prepared template ready for rendering. We won't go into details of how it works exactly, but by using this syntax `lit-html` can very efficiently update the dynamic parts of your template when your element re-renders.

Most popular IDEs support syntax highlighting of HTML inside template literals, but for some you might need to install a plugin. [See our IDE section](https://open-wc.org/developing/ide.html#visual-studio-code) to learn more about that.

lit-element works with a `render` function, which is called each time the element is updated. From this function, we return the template which is rendered to the page. Let's start by displaying the title of our app:

```js
class TodoApp extends LitElement {
  render() {
    return html`
      <h1>Todo app</h1>
    `;
  }
}

customElements.define('todo-app', TodoApp);
```

If you refresh the browser, you should see the title displayed on the page.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Templating basics

Templates are just javascript variables, we can also create them outside the context of our component. For example to share pieces of a template between different components.

Let's add a footer to our application. First, create the template for the footer. You can add your name and website in there as author:

```js
const footTemplate = html`
  <footer>Made with love by <a href="https://open-wc.org/">open-wc</a></footer>
`;
```

Template literals can contain placeholders. These are indicated by a dollar sign with curly braces: `${expression}`. For example, a common way to use it is to build error messages:

```js
// regular string
console.error('An error occurred: ' + message);
// template literal
console.error(`An error occurred: ${message}`);
```

lit-html takes advantage of this feature to compose templates and to create dynamic parts of your templates. For example, we can add the footer to our app's template by simply embedding it:

```js
class TodoApp extends LitElement {
  render() {
    return html`
      <h1>Todo app</h1>

      ${footerTemplate}
    `;
  }
}
```

You should now see both the app's title and footer on the page.

lit-html supports embedding different types of variables. In the example above we embedded a template in another template, but we can also embed strings. Let's extract the link text to a separate variable, and embed this in the template:

```js
const author = 'open-wc';
const footTemplate = html`
  <footer>Made with love by <a href="https://open-wc.org/">${author}</a></footer>
`;
```

We can also extract the link to a separate variable, and set the href attribute with a variable:

```js
const author = 'open-wc';
const homepage = 'https://open-wc.org/';
const footTemplate = html`
  <footer>Made with love by <a href="${homepage}">${author}</a></footer>
`;
```

When embedding variables like this, lit-html creates static and dynamic parts of your template. When re-rendering the same template you can change the value of these variables, and lit-html will know how to only update the parts that changed. This makes it very efficient!

<aside class="notice">
It's important to keep in mind that whatever you're writing must still be valid HTML, you cannot arbitrarily concatenate strings to build HTML. This is to enable efficient updates, and for security to protect you from XSS attacks.

For example you cannot set tagnames or attribute keys dynamically:

```js
const attributes = `href="https://open-wc.org/"`;
const tagname = 'footer';
// this does not work
const footTemplate = html`
  <${tagname}>
    Made with love by <a ${attributes}></a>
  </${tagname}>
`;
```

</aside>

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Displaying todos

Now that you know how to compose templates within lit-html, we can start adding a list of todos to our application.

Let's start by creating an array of todos in the constructor of our component:

```js
class TodoApp extends LitElement {
  constructor() {
    super();
    this.todos = ['Do A', 'Do B', 'Do C'];
  }
}
```

We can render this array directly inside the template of our application:

```js
class TodoApp extends LitElement {
  constructor() {
    super();
    this.todos = ['Do A', 'Do B', 'Do C'];
  }

  render() {
    return html`
      <h1>Todo app</h1>

      ${this.todos} ${footerTemplate}
    `;
  }
}
```

When you pass an array to lit-html, it will just iterate and render what's inside it. In this case, it will render the list of todos as plain text.

Just displaying text is not what we want though, we need something more complex. This is where we can combine two capabilities of lit-html: iterating arrays and rendering nested templates. If we turn our array of strings to an array of templates, we can render HTML for each of our todos.

A great way to accomplish this is through a map function. Let's create an ordered list of todos:

```js
class TodoApp extends LitElement {
  constructor() {
    super();
    this.todos = ['Do A', 'Do B', 'Do C'];
  }

  render() {
    return html`
      <h1>Todo app</h1>

      <ol>
        ${this.todos.map(
          todo => html`
            <li>${todo}</li>
          `,
        )}
      </ol>

      ${footerTemplate}
    `;
  }
}
```

Besides displaying the text of a todo item, we need to indicate whether the todo item is finished or not.

Let's update our data structure from strings to objects and display the finished state on the screen:

```js
class TodoApp extends LitElement {
  constructor() {
    super();
    this.todos = [
      { text: 'Do A', finished: true },
      { text: 'Do B', finished: false },
      { text: 'Do C', finished: false }
    ];
  }

  render() {
    return html`
      <h1>Todo app</h1>

      <ol>
      ${this.todos.map(todo => html`
        <li>${todo.text} (${this.finished ? 'Finished' : 'Unfinished')})</li>
      `)}
      </ol>

      ${footerTemplate}
    `;
  }
}
```

Because template literals allow us to place any expression inside the curly braces, we can use ternary operators for quick conditional logic.

You should now see three todo items on the screen, where the first one is already finished.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Adding a todo

Now, we will add the ability to add todos to our list.

Start by adding an input field and a button:

```js
class TodoApp extends LitElement {
  constructor() {
    super();
    this.todos = [
      { text: 'Do A', finished: true },
      { text: 'Do B', finished: false },
      { text: 'Do C', finished: false }
    ];
  }

  render() {
    return html`
      <h1>Todo app</h1>

      <input id="addTodoInput" placeholder="Name">
      <button @click=${this._addTodo}>Add</button>

      <ol>
      ${this.todos.map(todo => html`
        <li>${todo.text} (${todo.finished ? 'Finished' : 'Unfinished')})</li>
      `)}
      </ol>

      ${footerTemplate}
    `;
  }
}
```

On the add button, we added an event listener for the `click` event. This is done by prefixing the event name with a `@`:

```js
<button @click=${this._addTodo}>
```

The value of an event listener should be a function. In this case, we reference a method on our component, which we should now implement:

```js
_addTodo() {
  const input = this.shadowRoot.getElementById('addTodoInput');
  const text = input.value;
  input.value = '';

  this.todos.push([{ text, finished: false }]);
  this.requestUpdate();
}
```

When this event handler is called, we create a new todo item and add it to the array of todos. Because we're mutating the todos array, `LitElement` is not able to pick up that we changed something. We can let `LitElement` know about this by calling the `requestUpdate` which exists on any element that extends from `LitElement`.

When you click add, you should see the new element appear on the screen.

This allows us to observe the power of lit-html in action. If you inspect the DOM while adding a todo item, you will see that only the new todo item is actually flashing:

TODO: add img

![todo](./assets/foo.png)

When something in the DOM inspector flashes, it means that the browser is doing actual work to update the DOM tree. This is very expensive work, things like styles and layout need to be recalculated up and down the tree, so you want to minimize this as much as possible. Due to the way lit-html templating works it knows precisely what changed where and it will update only that part, without requiring a lot of from the developer.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Reactive property changes

Right now we're triggering an update manually when we make a change. This is fine for some use cases, but it can get pretty cumbersome to do this manually all the time and you will not be able to respond updated triggered by a parent element.

It's better to let `LitElement` observe data changes and trigger updates for us. We can do this by defining `todos` as a property of our element.

Start by adding a static properties object to our element, and add `todos` as an array property:

```js
static get properties() {
  return {
    todos: { type: Array }
  };
}
```

Because we're mutating the todos array using `push`, `LitElement` is not able to pick up the change. `LitElement` change detection is based on immutability, it only detects a change if you create a new array with your changes added. This is a common pattern in front-end to simplify data flow and make change detection easier.

Instead of using push, we can easily copy the existing list of todos using array spread, and add our new todo to the new array:

```js
_addTodo() {
  const input = this.shadowRoot.getElementById('addTodoInput');
  const text = input.value;
  input.value = '';

  this.todos = [
    ...this.todos,
    { text, finished: false },
  ];
}
```

The list should now still update like before.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Deleting a todo

If we make a mistake, we want to be able to remove a todo item from the list.

Let's add a delete button to the template of a todo item:

```js
html`
  <ol>
  ${this.todos.map(todo => html`
    <li>
      ${todo.text} (${todo.finished ? 'Finished' : 'Unfinished')})
      <button @click=${() => this._removeTodo(item)}>X</button>
    </li>
  `)}
  </ol>
`
```

We need to pass along the item we want to delete to the event handler, so instead of referencing the method directly we are using an arrow function and we call it with the item of the current iteration of our map function.

Next, we add the event handler which deleted the todo item:

```js
_removeTodo(item) {
  this.todos = this.todos.filter(e => e !== item);
}
```

The delete button should now be fully functional. Because filter returns a new array, `LitElement` will automatically detect the changes and re-render our component.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Finishing a todo

A todo list is useless if we can't keep track of which ones we've finished and which ones we have not. We need to add a way to mark todo items as finished or unfinished.

First, let's replace our finished/unfinished text with a checkbox:

```js
class TodoApp extends LitElement {
  constructor() {
    super();
    this.todos = [
      { text: 'Do A', finished: true },
      { text: 'Do B', finished: false },
      { text: 'Do C', finished: false },
    ];
  }

  render() {
    return html`
      <h1>Todo app</h1>

      <input id="addTodoInput" placeholder="Name" />
      <button @click=${this._addTodo}>Add TODO</button>

      <ol>
        ${this.todos.map(
          todo => html`
            <li>
              <input
                type="checkbox"
                ?checked=${todo.finished}
                @change=${e => this._changeTodoFinished(e, todo)}
              />
              ${todo.text}
              <button @click=${() => this._removeTodo(todo)}>X</button>
            </li>
          `,
        )}
      </ol>

      ${footerTemplate}
    `;
  }
}
```

Notice that we prefixed the `checked` attribute on the checkbox with a `?`. Checked is a boolean attribute, and this is special lit-html syntax to conditionally set the attribute based on the value that's passed to it.

<aside class="notice">
In HTML, a boolean attribute is 'true' when it's present, no matter the content. It's only false when it's not present. So in all these cases, hidden is true:

```html
<div hidden>
  <div hidden="hidden">
    <div hidden="not-hidden">
      <div hidden="true">
        <div hidden="false"></div>
      </div>
    </div>
  </div>
</div>
```

and only in this case, hidden is false:

```html
<div></div>
```

</aside>

We're listening to the input's `change` event to update our data when the checkbox value was changed. Besides the todo object, we are also passing along the event object itself. We need this to get the value of the checkbox.

In the event handler, we can use a map function to update the finished property of our todo:

```js
_changeTodoFinished(e, changedTodo) {
  const finished = e.target.checked;

  this.todos = this.todos.map((todo) => {
    if (todo !== changedTodo) {
      return todo;
    }
    return { ...changedTodo, finished };
  });
}
```

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Displaying totals

Now that we can manage our todo items, it's pretty easy to display some more information about our list. For example, we can add the total amount of finished and unfinished items.

These are not new sources of data, but rather a simple calculation based on existing data. We could do these calculations inline in our template where we want to display them, but this can get messy pretty quickly.

A good practice is to use the top of your render function as a place to prepare variables with some meaningful names and to use those in your template for best readability.

Let's add our calculations to the render function, and display the calculated amounts in the template:

```js
render() {
  const finishedCount = this.todos.filter(e => e.checked).length;
  const unfinishedCount = this.todos.length - finishedCount;

  return html`
    <h1>Todo app</h1>

    <input id="addTodoInput" placeholder="Name">
    <button @click=${this._addTodo}>Add TODO</button>

    <ol>
    ${this.todos.map(todo => html`
      <li>
        <input type="checkbox" ?checked=${todo.finished} @change=${e => this._changeTodoFinished(e, item)}>
        ${todo.text}
        <button @click=${() => this._removeTodo(item)}>X</button>
      </li>
    `)}
    </ol>

    <p>Total finished: ${finishedCount}</p>
    <p>Total unfinished: ${finishedCount}</p>

    ${footerTemplate}
  `;
}
```

Remember that the render function can be called quite often. If the computations are pretty expensive it's better to only do them once and cache the results.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Create a child component

It looks like we're feature complete! We can display a list of todos, add or remove them and check them off as we finish them.

However we've been putting everything into one component, and it's starting to get crowded. It's better to split things up into separate components, we're building web components after all.

The todo list would be an ideal candidate for moving into a separate component. Let's go ahead and define the basic structure of our element. If you're working in an online editor, it's probably easiest to do this in the same file. If you're using a local editor, it's best to create a separate file for this.

If you use a separate file, don't forget to import `LitElement` and `html` for that module as well.

```js
class TodoList extends LitElement {
  static get properties() {
    return {
      todos: { type: Array },
    };
  }

  render() {
    if (!this.todos) {
      return html``;
    }

    return html`
      <ol>
        ${this.todos.map(
          todo => html`
            <li>
              <input
                type="checkbox"
                .checked=${todo.finished}
                @change=${e => this._changeTodoFinished(e, todo)}
              />
              ${todo.text}
              <button @click=${() => this._removeTodo(todo)}>X</button>
            </li>
          `,
        )}
      </ol>
    `;
  }
}

customElements.define('todo-list', TodoList);
```

Ok so the structure of the class should be pretty familiar now, there is a `todos` property and a template to render. The template looks almost the same as the previous, except that now there is an if statement at the start. We need this because unlike before, our todo list isn't the one in charge of the data.

The parent element is still in charge, and we expect it to pass along the todos list to this component. This means that we cannot assume the list to always be there when we do a render. If we don't take care of this somehow, our component will crash because you cannot run a `map` function on `undefined.` Adding early returns in your render function is a simple way to do this, it's easy to see which properties are required for rendering.

Next, we need to somehow let the parent element know that the user clicked on the checkbox or remove the button. We can do this using DOM events. DOM events are great because the structure and hierarchy of our application are reflected in the DOM, so when a component fires an event only its parent components can receive them. This creates an automatic scoped system.

Let's add the events we want to fire:

```js
_changeTodoFinished(e, changedTodo) {
  const eventDetails = { changedTodo, finished: e.target.checked };
  this.dispatchEvent(new CustomEvent('change-todo-finished', { detail: eventDetails }));
}

_removeTodo(item) {
  this.dispatchEvent(new CustomEvent('remove-item', { detail: item }));
}
```

The parent element will need to listen to these events, and update the data structure accordingly. We will look into that in the next step.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Implement a child element

Now that we've created our child element, we need to implement it in the parent element. If you created your child component in a separate file, you will need to import it in the parent element:

```js
import './todos-list.js';
```

Some online editors automatically include separate files.

To render our child component, we simply replace the existing template with the tag for the child component:

```js
render() {
  return html`
    <h1>Todo list</h1>

    <input id="addTodoInput" placeholder="Name"><button @click=${this._addTodo}>Add TODO</button>

    <todo-list .todos=${this.todos}></todo-list>

    <p>Total finished: ${this._finishedCount}</p>
    <p>Total unfinished: ${this._unfinishedCount}</p>
  `;
}
```

If you refresh, the UI should remain unchanged. Congratulations, you're already composing elements like a pro :)

In the template we added, we're seeing something different than before. We're passing along our list of todos to the `todo-list` using an attribute with a `.` in front of it:

```js
html`
  <todo-list .todos=${this.todos}></todo-list>
`;
```

This is a special lit-html syntax, where instead of setting an attribute it will set a property on the element. The differences between attributes and properties are something that confuses a lot of people, but it's a very simple concept.

Attribute are how we can assign data in HTML:

```html
<input value="foo" />
```

Properties are how we can assign data in javascript, on the actual DOM element in javascript:

```js
const input = /* get a reference to the input element */;
input.value = 'foo';
```

lit-html allows setting properties through markup by prefixing the key with a `.`:

```html
<input .value="foo" />
```

It's up to each element how (and if) to keep properties and attributes in sync, a common practice is to sync changes to an attribute to a property of the same name but not to reflect changes to properties to an attribute of the same name.

Next, we need to listen to the new events we just created:

```js
html`
  <todo-list
    .todos=${this.todos}
    @change-todo-finished=${this._changeTodoFinished}
    @remove-todo=${this._removeTodo}
  ></todo-list>
`;
```

The events are calling the existing methods we are already have on our element. However, we will need to update the event handlers slightly to handle these new events:

```js
_changeTodoFinished(e) {
  const { changedTodo, finished } = e.detail;

  this.todos = this.todos.map((todo) => {
    if (todo !== changedTodo) {
      return todo;
    }
    return { ...changedTodo, finished };
  });
}

_removeTodo(e) {
  this.todos = this.todos.filter(todo => todo !== e.detail);
}
```

After this, your application should work just like before but not with the code spread out a bit more.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      ...code sample goes here...
    </script>
  </body>
</html>
```

</detail>

## Styling

We've covered the basics of templating and managing data with lit-element. The last remaining topic we need to look into is styling. This isn't a codelab on CSS, so we will only look at some of the specifics of working with styling in lit-element.

For styling, lit-element uses shadow dom. If you're not familiar with shadow dom, I recommend following the web component basics codelab.

To define the styles of your element, we need to import the `css` tag and add a static styles property on our element. Let's add styles to the todo list:

```js
import { LitElement, css } from 'https://unpkg.com/lit-element?module';

class TodoList extends LitElement {
  static get properties() {
    return {
      todos: { type: Array },
    };
  }

  static get styles() {
    return css`
      ul {
        list-style: none;
        padding: 0;
      }

      button {
        background-color: transparent;
        border: none;
      }
    `;
  }

  render() {
    if (!this.todos) {
      return html``;
    }

    return html`
      <ol>
        ${this.todos.map(
          todo => html`
            <li>
              <input
                type="checkbox"
                .checked=${todo.finished}
                @change=${e => this._changeTodoFinished(e, todo)}
              />
              ${todo.text}
              <button @click=${() => this._removeTodo(todo)}>X</button>
            </li>
          `,
        )}
      </ol>
    `;
  }
}

customElements.define('todo-list', TodoList);
```

The styles we define here only apply to our element. This is a guarantee built into the browser because we're using shadow DOM, lit-element does not need to do any extra work for that. This means we can write simple CSS selectors, and not need to worry about creating conflicts with styles defined elsewhere on the page.

<detail>
  <summary>View final result</summary>

```html
<!DOCTYPE html>
<html>
  <head></head>

  <body>
    <todo-app></todo-app>

    <script type="module">
      import { LitElement, html, css } from 'https://unpkg.com/lit-element?module';

      class TodoList extends LitElement {
        static get properties() {
          return {
            todos: { type: Array },
          };
        }

        static get styles() {
          return css`
            ul {
              list-style: none;
              padding: 0;
            }

            button {
              background-color: transparent;
              border: none;
            }
          `;
        }

        render() {
          if (!this.todos) {
            return html``;
          }

          return html`
            <ol>
              ${this.todos.map(
                todo => html`
                  <li>
                    <input
                      type="checkbox"
                      .checked=${todo.finished}
                      @change=${e => this._changeTodoFinished(e, todo)}
                    />
                    ${todo.text}
                    <button @click=${() => this._removeTodo(todo)}>X</button>
                  </li>
                `,
              )}
            </ol>
          `;
        }

        _changeTodoFinished(e, changedTodo) {
          const eventDetails = { changedTodo, finished: e.target.checked };
          this.dispatchEvent(new CustomEvent('change-todo-finished', { detail: eventDetails }));
        }

        _removeTodo(todo) {
          this.dispatchEvent(new CustomEvent('remove-todo', { detail: todo }));
        }
      }

      customElements.define('todo-list', TodoList);

      class TodoApp extends LitElement {
        static get properties() {
          return {
            todos: { type: Array },
          };
        }

        constructor() {
          super();

          this.todos = [
            { text: 'Do A', finished: true },
            { text: 'Do B', finished: false },
            { text: 'Do C', finished: false },
          ];
        }

        render() {
          const finishedCount = this.todos.filter(t => t.finished).length;
          const unfinishedCount = this.todos.length - finishedCount;

          return html`
            <h1>Todo list</h1>

            <input id="addTodoInput" placeholder="Name" /><button @click=${this._addTodo}>
              Add todo
            </button>

            <todo-list
              .todos=${this.todos}
              @change-todo-finished=${this._changeTodoFinished}
              @remove-todo=${this._removeTodo}
            ></todo-list>

            <p>Total finished: ${finishedCount}</p>
            <p>Total unfinished: ${unfinishedCount}</p>
          `;
        }

        _changeTodoFinished(e) {
          const { changedTodo, finished } = e.detail;

          this.todos = this.todos.map(todo => {
            if (todo !== changedTodo) {
              return todo;
            }
            return { ...changedTodo, finished };
          });
        }

        _addTodo() {
          const input = this.shadowRoot.getElementById('addTodoInput');
          const text = input.value;
          input.value = '';

          this.todos = [...this.todos, { text, finished: false }];
        }

        _removeTodo(e) {
          this.todos = this.todos.filter(todo => todo !== e.detail);
        }
      }

      customElements.define('todo-app', TodoApp);
    </script>
  </body>
</html>
```

</detail>

## TODO

- Further reading page
- Link to wc codelab in different places