[![Build Status](https://travis-ci.org/IBM/watson-review-analyzer.svg?branch=master)](https://travis-ci.org/IBM/watson-review-analyzer)

# Create a Review Analyzer with Watson Discovery

In this Code Pattern, we will create a Node.js app that takes the reviews from an online shopping website, Amazon, and feeds them into the Watson Discovery service. The reviews will be stored in a Cloudant or couchdb database. The Watson Discovery service will show the overall sentiments of the reviews. The sample application will do all the reading of reviews for you and will give an overall insight about them. The Code Pattern can be useful to developers that are looking into processing multiple documents with Watson Discovery.

When the reader has completed this Code Pattern, they will understand how to:

* Interact with Watson Discovery using Watson's Node SDK
* Build a User Inerface around result of Watson Discovery
* Deploy the app in Kubernetes
* Deploy and connect a CouchDB in the same instance of Kubernetes

<!--Remember to dump an image in this path-->
![insert image here](/images/initial.png)

## Flow
1. ...
2. ...
3. ...

## Included components
* [Watson Discovery](https://www.ibm.com/watson/services/discovery/):  A cognitive search and content analytics engine for applications to identify patterns, trends, and actionable insights.
* [Kubernetes Cluster](https://console.bluemix.net/containers-kubernetes/catalogCluster): Create and manage your own cloud infrastructure and use Kubernetes as your container orchestration engine.

## Featured technologies
* [Node.js](https://nodejs.org/): An open-source JavaScript run-time environment for executing server-side JavaScript code.
* [Databases](https://en.wikipedia.org/wiki/IBM_Information_Management_System#.22Full_Function.22_databases): Repository for storing and managing collections of data.
* [Cloud](https://www.ibm.com/developerworks/learn/cloud/): Accessing computer and information technology resources through the Internet.

# Prerequisite

Create a Kubernetes cluster with either [Minikube](https://kubernetes.io/docs/getting-started-guides/minikube) for local testing, or with [IBM Bluemix Container Service](https://github.com/IBM/container-journey-template/blob/master/README.md) to deploy in cloud. The code here is regularly tested against [Kubernetes Cluster from Bluemix Container Service](https://console.ng.bluemix.net/docs/containers/cs_ov.html#cs_ov) using Travis.

Install [Docker](https://www.docker.com) by following the instructions [here](https://www.docker.com/community-edition#/download) for your preferrerd operating system. You would need docker if you want to build and use your own images.

# Steps

1. [Clone the repo](#1-clone-the-repo)
2. [Create IBM Cloud services](#2-create-compose-for-mongodb-service-with-ibm-cloud)
3. [Build your images](#3-build-your-images)
4. [Configure Deployment files](#4-configure-deployment-files)
5. [Deploy the application](#5-deploy-the-application)
6. [Search for a product in Amazon](#6-search-for-a-product-in-amazon)

### 1. Clone the repo

```
$ git clone https://github.com/IBM/watson-review-analyzer
```

### 2. Create IBM Cloud services
<!--Watson Discovery-->

### 3. Build your images
<!--Build the nodejs app-->

### 4. Configure Deployment files
<!--add credentials in deployment files. create secrets from config.json-->

### 5. Deploy the application
<!--Deploy in kubernetes (1) nodejs app and (2) couchdb instance. Access via external ip-->

### 6. Search for a product in Amazon

# Learn more

* **Node.js Code Patterns**: Enjoyed this Code Pattern? Check out our other [Node.js Code Patterns](https://developer.ibm.com/code/technologies/node-js/)

# License
[Apache 2.0](LICENSE)