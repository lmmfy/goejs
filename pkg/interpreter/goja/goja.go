package goja

import (
	"fmt"

	"github.com/dop251/goja"
	"github.com/lmmfy/goejs/pkg/contract"
	"github.com/lmmfy/goejs/pkg/ejs"
)

const callRender = `
;
function callRender(tpl, data, opt) {
	return exports.render(tpl, data, opt);
}
;`

type gojaEngine struct {
	script         contract.Script
	code           string
	program        *goja.Program
	renderFunction goja.Callable
	vm             *goja.Runtime
}

// Deprecated: exists fault error.
func NewDefauleGojaEngine() contract.Engine {
	engine := &gojaEngine{
		script: ejs.NewJsScript(),
	}
	engine.code = engine.script.GetScriptCode()
	program, err := goja.Compile("", engine.code+callRender, true)
	if err != nil {
		panic(err)
	}
	engine.program = program

	vm := goja.New()
	_, err = vm.RunProgram(program)
	if err != nil {
		panic(err)
	}
	engine.vm = vm

	renderFunction, ok := goja.AssertFunction(vm.Get("callRender"))
	if !ok {
		panic(fmt.Errorf("cannot found callRender function"))
	}
	engine.renderFunction = renderFunction

	return engine
}

func (e *gojaEngine) RegisterLibrary(file string) error {
	panic("todo")
}

func (e *gojaEngine) Exec(tpl string, data interface{}, opt *contract.Option) (string, error) {
	if opt == nil {
		opt = &contract.DefaultOption
	}
	opt.Filename = "goja_embed.js"

	e.vm.NewArray()
	res, err := e.renderFunction(goja.Undefined(), e.vm.ToValue(tpl), e.vm.ToValue(data), e.vm.ToValue(opt))
	if err != nil {
		return "", err
	}
	return res.String(), nil
}
