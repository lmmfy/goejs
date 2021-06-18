package ejs

import (
	"bytes"
	"text/template"

	"github.com/gobuffalo/packr/v2"
	"github.com/lmmfy/goejs/pkg/contract"
)

const (
	Version               = "v1.0.0"
	DefaultOpenDelimiter  = "<"
	DefaultCloseDelimiter = ">"
	DefaultDelimiter      = "%"
)

type jsScript struct {
	ejsLib string
}

type scriptOption struct {
	Version        string
	OpenDelimiter  string
	CloseDelimiter string
	Delimiter      string
}

func newScriptOption() *scriptOption {
	return &scriptOption{
		Version:        Version,
		OpenDelimiter:  DefaultOpenDelimiter,
		CloseDelimiter: DefaultCloseDelimiter,
		Delimiter:      DefaultDelimiter,
	}
}

type WithScriptOptionFunc = func(opt *scriptOption)

func WithOpenDelimiter(od string) WithScriptOptionFunc {
	return func(opt *scriptOption) {
		opt.OpenDelimiter = od
	}
}

func WithCloseDelimiter(cd string) WithScriptOptionFunc {
	return func(opt *scriptOption) {
		opt.CloseDelimiter = cd
	}
}

func WithDelimiter(d string) WithScriptOptionFunc {
	return func(opt *scriptOption) {
		opt.Delimiter = d
	}
}

func NewJsScript(optFuncs ...WithScriptOptionFunc) contract.Script {
	opt := newScriptOption()
	for _, f := range optFuncs {
		f(opt)
	}

	ejs, _ := js().FindString("ejs.js")
	tpl, err := template.New("").Parse(ejs)
	if err != nil {
		panic(err)
	}

	var buf bytes.Buffer
	if err := tpl.Execute(&buf, opt); err != nil {
		panic(err)
	}

	return &jsScript{
		ejsLib: buf.String(),
	}
}

func (s *jsScript) GetScriptCode() string {
	return s.ejsLib
}

//go:generate packr2
func js() *packr.Box {
	return packr.New("js", "./js/")
}
