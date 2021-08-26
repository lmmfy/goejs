package otto

import (
	"os"

	"github.com/lmmfy/goejs/pkg/contract"
	"github.com/lmmfy/goejs/pkg/ejs"
	"github.com/robertkrimen/otto"
)

const callRender = `
;
var res = exports.render(tpl, data, options);
;`

type ottoEngine struct {
	script contract.Script
	// compiledEjs *otto.
	vm             *otto.Otto
	compiledScript *otto.Script
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
		script: ejs.NewJsScript(),
		vm:     otto.New(),
	}
	engine.init()

	return engine
}

func (e *ottoEngine) RegisterLibrary(file string) error {
	fileContent, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	return e.compileScript(e.script.GetScriptCode() + ";\n" + string(fileContent))
}

func (e *ottoEngine) compileScript(script string) error {
	compiledScript, err := e.vm.Compile("", script+callRender)
	if err != nil {
		return err
	}
	e.compiledScript = compiledScript
	return nil
}

func (e *ottoEngine) init() {
	script := e.script.GetScriptCode()
	err := e.compileScript(script)
	if err != nil {
		panic(err)
	}
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
	_, err := vm.Run(e.compiledScript)
	if err != nil {
		return "", err
	}

	res, err := vm.Get("res")
	if err != nil {
		return "", err
	}

	return res.ToString()
}
