# Javascript promise implementation

> _"What I cannot create, I do not understand"_ - Richard Feynman

In this spirit I wanted to more thoroughly understand JS promises so I implemented my own `MyPromise`-class.

This was a fun little exercise to understand some promise intricacies in particular how it works with the Microtask Queue.

## Roadmap

- [ ] Fix remaining Type errors and add `MyPromise implements Promise` for full compatibility
- [ ] The current test library is a stub. Test against [Promises/A+ Compliance test suite](https://github.com/promises-aplus/promises-tests)
- [ ] Implement "modern" methods recently added to the native Promise class

## Helpful sources

- Testkit courtesy of [WebDevSimplified](https://github.com/WebDevSimplified/js-promise-library)
