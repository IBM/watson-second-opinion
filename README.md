[![Build Status](https://travis-ci.org/IBM/watson-review-analyzer.svg?branch=master)](https://travis-ci.org/IBM/watson-review-analyzer)

# watson-review-analyzer
An application that ingests unstructured reviews and uses Watson Discovery to find insights and provide a second opinion on the reviews. 

## Installation

Edit the `config.json.sample` file to include your Watson Discovery username and password. Then rename the file to `config.json`


```
$ npm install
```

Next, provide environment variables to access the cloudant database. Example shown below. 

```
export CLOUDANT_URL=https://<user>:<password>@anthonyamanse.cloudant.com```
```
Now, you are ready to run the app!
```
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
