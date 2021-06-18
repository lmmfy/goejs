package goja

import (
	"os"
	"regexp"
	"testing"

	"github.com/stretchr/testify/assert"
)

var singleSpacePattern = regexp.MustCompile(`\s+`)

func Test_gojaEngine_Exec(t *testing.T) {
	type args struct {
		file string
		data interface{}
	}
	tests := []struct {
		name    string
		args    args
		want    string
		wantErr bool
	}{
		{
			name: "test hello.ejs",
			args: args{
				file: "../testdata/hello.ejs",
				data: map[string]interface{}{
					"name": "world",
				},
			},
			want:    "Hello world!",
			wantErr: false,
		},
		// {
		// 	name: "test list.ejs",
		// 	args: args{
		// 		file: "../testdata/list.ejs",
		// 		data: map[string]interface{}{
		// 			"names": []string{"foo", "bar"},
		// 		},
		// 	},
		// 	want: `<ul>
		//         <li foo='foo&#39;'>foo</li>
		//         <li foo='bar&#39;'>bar</li>
		//   </ul>`,
		// 	wantErr: false,
		// },
		// {
		// 	name: "test functions.ejs",
		// 	args: args{
		// 		file: "../testdata/functions.ejs",
		// 		data: map[string]interface{}{
		// 			"users": []map[string]interface{}{
		// 				{
		// 					"name": "Tobi", "age": 2, "species": "ferret",
		// 				},
		// 				{
		// 					"name": "Jane", "age": 6, "species": "ferret",
		// 				},
		// 			},
		// 		},
		// 	},
		// 	want: `<h1>Users</h1>
		// 			<ul>
		// 				<li><strong>Tobi</strong> is a 2year old ferret.</li>
		// 				<li><strong>Jane</strong> is a 6 year old ferret.</li>
		// </ul>`,
		// 	wantErr: false,
		// },
	}

	e := NewDefauleGojaEngine()
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tpl, err := os.ReadFile(tt.args.file)
			assert.NoError(t, err)
			if err != nil {
				return
			}

			got, err := e.Exec(string(tpl), tt.args.data, nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("ottoEngine.Exec() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if singleSpacePattern.ReplaceAllString(got, "") != singleSpacePattern.ReplaceAllString(tt.want, "") {
				t.Errorf("ottoEngine.Exec() = %v, want %v", singleSpacePattern.ReplaceAllString(got, ""), singleSpacePattern.ReplaceAllString(tt.want, ""))
			}
		})
	}
}
