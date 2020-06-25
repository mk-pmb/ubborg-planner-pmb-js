﻿
<!--#echo json="package.json" key="name" underline="=" -->
ubborg-planner-pmb
==================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Helps me describe system configurations.
<!--/#echo -->



API
---

None.


Usage
-----

```bash
# Render the requirements described in plan.mjs as JSON:
$ ubborg-planner-pmb depsTree --format=json plan
```


<!--#toc stop="scan" -->



Known issues
------------

* Parameterized bundles are a very poor stopgap for proper support of
  user-supplied resource types, because they retain their singleton nature.
* Needs more/better tests and docs.




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
