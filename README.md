
IMPORTANT: This module only works with node v0.4.0 and later.


This project was forked from https://github.com/postwait/node-amqp

# Installation Instructions


## Prerequisite Software (if already install skip to)

### git

    The best way to mange node.js and npm (Node Package Manager) is via git clone from repository github.com. The cloned modules should be keep in a standard location
    /var/git-repo (if directory does not exist, than manually create). The easiest way to install git is via the yum utility. If git is not installed, then install
    using the command below.

    yum install git

### node

    The below commands will install the latest stable version of node.js

   ```sh
   cd /var/git-repo
   git clone git://github.com/joyent/node.git (if port 9418 blocked use the http protocol http://github.com/joyent/node.git, which is a lot slower)
   cd node
   git checkout v0.8.7 (set to the desired version)
   ./configure
   make install (this step will take 5+ minutes)
   cd ..
   node --version (to verify install)

   /usr/local/bin/node will need to be added to the class path for users who want to access node without using full path
   ```

### npm
  ```sh
  cd /var/git-repo
  git clone git://github.com/isaacs/npm.git (if port 9418 blocked use the http protocol http://github.com/isaacs/npm.git, which is a lot slower)
  cd npm
  export PATH=$PATH:/usr/local/bin (add node to path if not already added)
  make install
  ```

## node-amqp

  All project specific deploys should be release in /usr/local/share/applications/. Since this module is part of the Message Bus family of applications it will be placed in
  sub-directory message-bus/msg-router

  '''sh
  git clone https://<user-id>@github.com/ppc-repo/msg-router.git (user-id wil need to be from a  ppc-repo/msg-router collaborator or the ppc-repo owner)
  cd msg-router
  git checkout 1.0.0 (set to desired version)
  npm install
  '''

  node server.js  * will start app on port 3000
  http://<host>:3000/ping  will return OK if application is functioning correctly

### Update application config

  Master configuration is contained in config/config.js. The desired .

### Logging configuration

  Default logging will be to the /logs under the application