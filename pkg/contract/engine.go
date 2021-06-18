package contract

type Engine interface {
	Exec(tpl string, data interface{}, opt *Option) (string, error)
}

type Option struct {
	Debug        bool   `json:"debug,omitempty"`
	CompileDebug bool   `json:"compileDebug,omitempty"`
	RmWhitespace bool   `json:"rmWhitespace,omitempty"`
	Filename     string `json:"filename,omitempty"`
	LocalsName   string `json:"localsName,omitempty"`
}

var DefaultOption = Option{
	Debug:        false,
	CompileDebug: false,
	RmWhitespace: false,
	Filename:     "go_embed.js",
}
