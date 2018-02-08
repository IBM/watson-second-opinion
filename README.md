[![Build Status](https://travis-ci.org/IBM/watson-review-analyzer.svg?branch=master)](https://travis-ci.org/IBM/watson-review-analyzer)

# watson-review-analyzer
An application that ingests unstructured reviews and uses Watson Discovery to find insights and provide a second opinion on the reviews. 

## 1. Create IBM Cloud services

Create the following services:

* [**Watson Discovery**](https://console.ng.bluemix.net/catalog/services/discovery)

* [**Cloudant NoSQL DB**](https://console.bluemix.net/catalog/services/cloudant-nosql-db)


## 2. Installation

Edit the `config.json.sample` file to include your Watson Discovery username and password. Then rename the file to `config.json`.

Next, install all the required dependencies for the project.

```
$ npm install
```

Next, provide your Cloudant URL from your Cloudant Service Credentials as an environment variable.

```
export CLOUDANT_URL=https://1111405-438f-4374-9b43-975e0220f3cd-bluemix:935684a91478c5f8918d3d0b2e004ef6fe825939ed2304f28ec2225fa9a952df@8bb72405-438f-4374-9b43-975e0220f3cd-bluemix.cloudant.com
```
Now, you are ready to run the app!
```
$ node app.js
```

## 3. Usage
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
