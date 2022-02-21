# goejs

[![Go Report Card](https://goreportcard.com/badge/github.com/lmmfy/goejs)](https://goreportcard.com/report/github.com/lmmfy/goejs)
![](https://github.com/lmmfy/goejs/workflows/gotest/badge.svg)
![](https://github.com/lmmfy/goejs/workflows/style-check/badge.svg)
[![codecov](https://codecov.io/gh/lmmfy/goejs/branch/main/graph/badge.svg)](https://codecov.io/gh/lmmfy/goejs)
[![GoDoc](https://godoc.org/github.com/lmmfy/goejs?status.svg)](https://godoc.org/github.com/lmmfy/goejs)

<br/>
<p>
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square">
<img src="https://img.shields.io/github/last-commit/lmmfy/goejs?style=flat-square">
</p>

provider a powerful template by using ejs in go interpreter. But you should **very careful to using it in a high traffic business**.

## Usage

### basic

```go
// default
e := otto.NewDefaultOttoEngine()
got, _ := e.Exec("hello, <%= name %>!", map[string]interface{}{"name": "goejs"}, &contract.Option{
	Debug: true,
})
fmt.Println(got) // hello, goejs!

// config 
e := otto.NewOttoEngine(ejs.NewJsScript(ejs.WithOpenDelimiter("{"), ejs.WithOpenDelimiter("}")))
got, _ := e.Exec("hello, {%= name %}!", map[string]interface{}{"name": "goejs"}, &contract.Option{
	Debug: true,
})
fmt.Println(got) // hello, goejs!
```

### advanced

1. keep json original

```go
person := struct {
	Name string
	Age int
}{
	Name: "go-ejs",
	Age: 20,
}

e := otto.NewDefaultOttoEngine()
got, _ := e.Exec("person: <%- JSON.stringify(person) %>", map[string]interface{}{"person": person}, &contract.Option{
	Debug: true,
})
fmt.Println(got) // person: {"Age":20,"Name":"go-ejs"}
```


2. register js library

```js
// lib.js
if (typeof sum == 'function') { 
	function sum(a, b) {
		return a + b;
	}
}
```

```go
e := otto.NewOttoEngine(ejs.NewJsScript(ejs.WithOpenDelimiter("{"), ejs.WithOpenDelimiter("}")))
e.RegisterLibrary("./lib.js")
got, _ := e.Exec("{%= sum(1, 2) %}!", nil, nil)
fmt.Println(got) // 3
```

goja exists error, use otto first.

## why use ejs

compare top js template engine on [bestofjs](https://bestofjs.org/projects?tags=template), feature(call function in template) in ejs is most powerful.

## feature

- keep most of the features of ejs(js version)
- support register js library

## diff with ejs

- not support include, partials
- not use strict
- remove opts.scope
- remove opts.async
- remove opts.client
- remove opts.destructuredLocals

## best Scene

- admin page
- config template 
- dev tool

## more ejs syntax

https://ejs.co/#docs

## Thanks

- [ejs](https://github.com/mde/ejs/)
- [otto](https://github.com/robertkrimen/otto)
