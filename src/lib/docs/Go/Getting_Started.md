# Getting Started

Declare a `main` package (a package is a way to group functions, and it's made up of all the files in the same directory).

## Install external package

```go
go get package-name // add and update go.mod
go mod tidy // exclude and update dependencies
```

<br />

`go.sum` - Store hashes from packages downloaded

## Create a package

In Go, a package is basically a folder with .go files that share the same package name.
In your example:

* greetings/greetings.go uses package greetings

* hello/hello.go uses package main
  How to create a package

After create a local package, you need to import on `go.mod`:

* You can edit using `go mod edit -replace example.com/greetings=../greetings`

* After that, use `go mod tidy` to sync

```
module example.com/hello

go 1.26.3

replace example.com/greetings => ../greetings

require example.com/greetings v0.0.0-00010101000000-000000000000
```

<br />

In go. capitalized functions represents external functions.

## Handler error

```go
// greetings.go

// Package greetings provides functions for greeting users.
package greetings

import (
	"errors"
	"fmt"
)

func Hello(name string) (string, error) {
	if name == "" {
		return "", errors.New("empty string")
	}

	message := fmt.Sprintf("Hi, %v. Welcome!", name)

	return message, nil
}
```

```go
// main.go

package main

import (
	"fmt"
	"log"
	"example.com/greetings"
)

func main() {
	log.SetPrefix("greetings: ")
	log.SetFlags(0)

	message, err := greetings.Hello("")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(message)
}
```

### Other common options

* `log.Println(...)` prints a log line
* `log.Printf(...)` prints using format strings, like `log.Printf("error: %v", err)`
* `log.Fatalln(...)` same as Fatal, but adds a newline
* `log.Panic(...)` prints and then calls panic
* `log.Panicln(...)` same as Panic, but adds a newline
* `log.SetPrefix(...)` sets a fixed prefix
* `log.SetFlags(...)` controls date, time, file, line number, etc.

#### Panic vs Fatal

`Fatal` exits immediately with `os.Exit(1)` and does not run defer.
Panic triggers a runtime panic, **runs defer, and can be recovered with recover**.

#### How to treat Panic error?

```go
package main

import (
	"fmt"
	"log"

	"example.com/greetings"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			log.Println("recovered from panic:", r)
		}
	}()

	log.SetPrefix("greetings: ")
	log.SetFlags(0)

	message, err := greetings.Hello("")
	if err != nil {
		log.Panic(err)
	}

	fmt.Println(message)
}
```

