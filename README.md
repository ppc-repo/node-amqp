
IMPORTANT: This module only works with node v0.4.0 and later.


This project was forked from https://github.com/postwait/node-amqp

# Installation Instructions


## Prerequisite Software (if already install skip to)

### git

#### dependencies
yum -y install zlib-devel openssl-devel cpio expat-devel gettext-devel gcc perl-ExtUtils-MakeMaker

### node

   ```sh
   git clone git://github.com/joyent/node.git
   cd node
   ./configure --prefix=~/local
   make install
   cd ..
   ```

### npm
  ```sh
  git clone git://github.com/isaacs/npm.git
  cd npm
  make install # or `make link` for bleeding edge
  ```

