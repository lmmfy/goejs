# goejs

[![Go Report Card](https://goreportcard.com/badge/github.com/lmmfy/goejs)](https://goreportcard.com/report/github.com/lmmfy/goejs)
![](https://github.com/lmmfy/goejs/workflows/gotest/badge.svg)
![](https://github.com/lmmfy/goejs/workflows/style-check/badge.svg)
[![codecov](https://codecov.io/gh/lmmfy/goejs/branch/main/graph/badge.svg)](https://codecov.io/gh/lmmfy/goejs)
[![GoDoc](https://godoc.org/github.com/lmmfy/goejs?status.svg)](https://godoc.org/github.com/lmmfy/goejs)

provider a powerful template by using ejs in go interpreter. But you should **very careful to using it in a high traffic business**.

## Usage

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

goja exists error, use otto first.

## why use ejs

compare top js template engine on [bestofjs](https://bestofjs.org/projects?tags=template), feature(call function in template) in ejs is most powerful.

## feature

keep most of the features of ejs(js version)

## diff with ejs

- not support include, partials
- keep `<%_`, `_%>`
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
