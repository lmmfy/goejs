package otto

import (
	"github.com/lmmfy/goejs/pkg/contract"
	"github.com/lmmfy/goejs/pkg/jslib"
	"github.com/robertkrimen/otto"
)

const callRender = `
;
var res = exports.render(tpl, data, options);
;`

type ottoEngine struct {
	script contract.Script
	// compiledEjs *otto.
	vm          *otto.Otto
	compiledEjs *otto.Script
}

func NewOttoEngine(script contract.Script) contract.Engine {
	engine := &ottoEngine{
		script: script,
		vm:     otto.New(),
	}
	engine.init()

	return engine
}

func NewDefaultOttoEngine() contract.Engine {
	engine := &ottoEngine{
		script: jslib.NewJsScript(),
		vm:     otto.New(),
	}
	engine.init()

	return engine
}

func (e *ottoEngine) init() {
	script := e.script.GetScriptCode()
	compiledScript, err := e.vm.Compile("", script+callRender)
	if err != nil {
		panic(err)
	}
	e.compiledEjs = compiledScript
}

func (e *ottoEngine) Exec(tpl string, data interface{}, opt *contract.Option) (string, error) {
	if opt == nil {
		opt = &contract.DefaultOption
	}
	opt.Filename = "otto_embed.js"

	vm := e.vm.Copy()

	vm.Set("tpl", tpl)
	vm.Set("data", data)
	vm.Set("options", opt)
	_, err := vm.Run(e.compiledEjs)
	if err != nil {
		return "", err
	}

	res, err := vm.Get("res")
	if err != nil {
		return "", err
	}

	return res.ToString()
}
