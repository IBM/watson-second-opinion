[![Build Status](https://api.travis-ci.org/IBM/watson-second-opinion.svg?branch=master)](https://travis-ci.org/IBM/watson-second-opinion)
# WARNING: This repository is no longer maintained ⚠️ USE AT YOUR OWN RISK

# Create a Review Analyzer with Watson Natural Language Understanding

https://watson-second-opinion.mybluemix.net/

![demo](https://i.makeagif.com/media/6-07-2018/IeEcIv.gif)

In this Code Pattern, we will create a Node.js app that takes the reviews from an online shopping website, Amazon, and feeds them into the Watson Natural Language Understanding service. The reviews will be stored in a Cloudant database. The Watson Natural Language Understanding service will show the overall sentiments of the reviews. The sample application will do all the reading of reviews for you and will give an overall insight about them. The Code Pattern can be useful to developers that are looking into processing multiple documents with Watson Natural Language Understanding.

When the reader has completed this Code Pattern, they will understand how to:

* Interact with Watson Natural Language Understanding using Watson's Node SDK
* Build a user interface around the result of Watson Natural Language Understanding
* Create and use Cloudant NoSQL Database
* Deploy a Nodejs application to analyze product reviews

<!--Remember to dump an image in this path-->
![Architecture](/docs/app-architecture.png)

## Flow
1. The user deploys the app in IBM Cloud. The user interacts with the user interface of the app.
2. The user enters the product URL and the app would start getting the reviews of the Product.
3. The app then stores the reviews in a database for later use.
4. The app starts to upload the reviews in Watson Natural Language Understanding.
5. After Watson Natural Language Understanding finishes processing the reviews, the app then stores the result (General Sentiment and Top Entities) in Cloudant. The user will see the result in the UI.

## Included components
* [Watson Natural Language Understanding](https://www.ibm.com/watson/services/natural-language-understanding/):  Analyze text to extract meta-data from content such as overall sentiment, emotion, concepts, entities, keywords, categories, relations and semantic roles.
* [Cloudant NoSQL DB](https://cloud.ibm.com/catalog/services/cloudant): A fully managed data layer designed for modern web and mobile applications that leverages a flexible JSON schema.

## Featured technologies
* [Node.js](https://nodejs.org/): An open-source JavaScript run-time environment for executing server-side JavaScript code.
* [Databases](https://en.wikipedia.org/wiki/IBM_Information_Management_System#.22Full_Function.22_databases): Repository for storing and managing collections of data.
* [Cloud](https://developer.ibm.com/depmodels/cloud/): Accessing computer and information technology resources through the Internet.

## Watch the Video

[![](docs/youtubePicture.png)](https://www.youtube.com/watch?v=wwNAEvbxd54&list=PLVztKpIRxvQXhHlMQttCfYZrDN8aELnzP&index=1&t=1s)

# Steps

Use the ``Deploy to IBM Cloud`` button **OR** create the services and run locally.

## Deploy to IBM Cloud
If you do not have an IBM Cloud account yet, you will need to create one [here](https://cloud.ibm.com/registration?cm_mmc=Email_Events-_-Developer_Innovation-_-WW_WW-_-horea-porutiu%5CWatsonAPITutorial%5CNov2017%5CYoutubeTutorial%5Cglobaldevadvgrp%5CSanFrancisco%5CCA%5CUnitedStates%5CKubernetes&cm_mmca1=000019RS&cm_mmca2=10004805&cm_mmca3=M99938765&cvosrc=email.Events.M99938765&cvo_campaign=000019RS).

[![Deploy to IBM Cloud](https://cloud.ibm.com/devops/setup/deploy/button.png)](https://cloud.ibm.com/devops/setup/deploy?repository=https://github.com/IBM/watson-second-opinion)

1. Press the above `Deploy to IBM Cloud`
    > The toolchain uses GitHub for its source control. You may be asked to authenticate the toolchain to use your account. The toolchain will clone this repo and will be used for its deployment.
<!--optional step-->
2. In Toolchains, click on ``Delivery Pipeline`` to watch while the app is deployed. Once deployed, the app can be viewed by clicking ``View app``.

<!--update with service names from manifest.yml-->
3. To see the app and services created and configured for this Code Pattern, use the IBM Cloud dashboard. The app will be named according to what you inputted in the toolchain. The following services are created and easily identified by the `wso-` prefix:
    * wso-nlu
    * wso-cloudant

### Update the Environment of your deployed app

![envVar1](https://i.makeagif.com/media/6-07-2018/Gfmeju.gif)

1. Navigate to https://cloud.ibm.com/dashboard/apps/
2. Located and click on your newly created application 
3. Select `Runtime` in the left menu
4. Select the `Environment Variables` tab in the middle of the page
5. Scroll down to the User defined variables section
6. Click on ``add``. 
7. THIS IS EXTREMELY IMPORTANT. Make sure to write the name of the env variable EXACTLY as shown, otherwise, the app wont work. Scroll up until you see `VCAP_SERVICES`. You will then see `cloudantNoSQLDB` and under that `url`.  Under `Name`, type in `CLOUDANT_URL`, and under `Value`, paste the `url` value from the `cloudantNoSQLDB` section of `VCAP_SERVICES`.

![envVar2](https://i.makeagif.com/media/6-07-2018/ubRZcv.gif)

8. **🚧🚧🚧PLEASE NOTE THE GIF ABOVE IS OUTDATED. INSTEAD OF NLU_USERNAME you will have to write iam_apikey🚧🚧🚧** Repeat step 6 but now under name, type in `iam_apikey` and under value go to the `credential` section of `natural-language-understanding` section of the `VCAP_SERVICES` and get the value for `apikey`.
9. Click ``save``.
10. Nice job! You are done. Click on ``visit App URL`` at the top of the page to interact with the app. Simply copy and paste an Amazon URL from a product page into the app, and click on the magnifying glass and voilà! You will get some valuable insights from Watson.

## Deploy Locally

### 1. Clone the repo

```
$ git clone https://github.com/IBM/watson-second-opinion
$ cd watson-second-opinion/
```

### 2. Install Dependencies

```
$ npm install
```

### 3. Create IBM Cloud services

Create the following service:

* [**Watson Natural Language Understanding**](https://cloud.ibm.com/catalog/services/natural-language-understanding)
* [**Cloudant NoSQL DB**](https://cloud.ibm.com/catalog/services/cloudant/)


### 4. Get Service Credentials

Once the service is created, click on it, and then click on `Service credentials` in the top left corner of the screen. Then click `New credential` and then `add`. For `Cloudant NoSQL DB`, save the value for `url`. For `Natural Language Understanding` save the value for `iam_apikey`.

### 5. Set Environment Variables

After we run ``npm install`` from step 2 above, we need to set 3 environment variables that we got from step 4. Run the following commands to set these variables (your usernames / passwords / url will be different):

```
$ export CLOUDANT_URL=https://f9d9e9d9-8b3f-4625-a425-7a8bbd57aeaf-bluemix:f6f4f68665aa1b6b7821ca0117302353427eb643306d3d2652bc867768bc4c80@f9d9e9d9-8b3f-4625-a425-7a8bbd57hdsf-bluemix.cloudant.com

$ export IAM_APIKEY=xJLkOtKCXISqQHwjfdRBb99u2r-5sJ7n_sEsfsTJXZiJ


```

### 6. Run the App

Run the app by starting Node.


```
$ node app.js
```

Go to `http://localhost:4000/` in your browser of choice, and you should be greeted with the Watson Second Opinion UI.

Find a product in Amazon that you want to learn more about, copy the URL of the product page, paste it into the app, and click 🔍. After Watson Natural Language Understanding finishes processing all the reviews, the app will show you its General Sentiment and Top entities found: 


![Landing Page](docs/analysis.png)

Great job! You've successfully run Watson Second Opinion on your local machine! Thanks for taking the time to walk through the app with me. I am welcoming all pull requests, and any updates to the project. Have fun with it! 

# Links

* [Watson Node.js SDK](https://github.com/watson-developer-cloud/node-sdk)

# Learn more

* **Node.js Code Patterns**: Enjoyed this Code Pattern? Check out our other [Node.js Code Patterns](https://developer.ibm.com/technologies/node-js/)
* **Artificial Intelligence Code Patterns**: Enjoyed this Code Pattern? Check out our other [AI Code Patterns](https://developer.ibm.com/technologies/artificial-intelligence/).
* **AI and Data Code Pattern Playlist**: Bookmark our [playlist](https://www.youtube.com/playlist?list=PLzUbsvIyrNfknNewObx5N7uGZ5FKH0Fde) with all of our Code Pattern videos
* **With Watson**: Want to take your Watson app to the next level? Looking to utilize Watson Brand assets? [Join the With Watson program](https://www.ibm.com/watson/with-watson/) to leverage exclusive brand, marketing, and tech resources to amplify and accelerate your Watson embedded commercial solution.

# License
This code pattern is licensed under the Apache Software License, Version 2.  Separate third party code objects invoked within this code pattern are licensed by their respective providers pursuant to their own separate licenses. Contributions are subject to the [Developer Certificate of Origin, Version 1.1 (DCO)](https://developercertificate.org/) and the [Apache Software License, Version 2](https://www.apache.org/licenses/LICENSE-2.0.txt).

[Apache Software License (ASL) FAQ](https://www.apache.org/foundation/license-faq.html#WhatDoesItMEAN)
