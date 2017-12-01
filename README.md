[![Build Status](https://travis-ci.org/IBM/watson-review-analyzer.svg?branch=master)](https://travis-ci.org/IBM/watson-review-analyzer)

# watson-review-analyzer

## Installation
```
$ npm install
$ node app.js
```

## Usage
`curl http://localhost:8080/reviews/[product-id]`

example:

`https://www.amazon.com/Colorful-Ultra-Thin-Anti-Drop-Premium-Material/product-reviews/B06XZ2CM2H/ref=cm_cr_getr_d_paging_btm_1?ie=UTF8&pageNumber=1`

product-id is _B06XZ2CM2H_
```JSON
curl http://localhost:8080/reviews/B06XZ2CM2H

[
	{
		"reviewer": "John Doe",
		"reviewerLink": "/foo/bar/johndoe",
		"text": "Good product",
		"title": "Five!",
                "rating": "5.0"
	},
	{
		"reviewer": "Jane Doe",
		"reviewerLink": "/foo/bar/janedoe",
		"text": "Meh",
		"title": "Works",
                "rating": "5.0"
	},
	{
		"..."
	},
	"..."
]
```
