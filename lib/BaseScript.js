/**
 * Copyright 2015-2021 BigML
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

"use strict";

const axios = require('axios');
const https = require('https');
const BigML = require('./BigML');
const Resource = require('./Resource');
const constants = require('./constants');
const logger = require('./logger');
const utils = require('./utils');

var createErrors = constants.HTTP_COMMON_ERRORS.slice();
createErrors.push(constants.HTTP_PAYMENT_REQUIRED);

function BaseScript(connection) {
  Resource.call(this, connection);
}

BaseScript.prototype = new Resource();

BaseScript.prototype.parent = Resource.prototype;

BaseScript.prototype.create = function (type, sourceCode, args, retry, cb) {
  /**
   * Creates a script and builds customized error and resource info
   *
   * Uses HTTP POST to send source code content.
   *
   * Returns a BigML resource wrapped in an object that includes
   *   code: HTTP status code
   *   resource: The resource/id
   *   location: Remote location of the resource
   *   object: The resource itself
   *   error: An error code and message
   *
   * @param {string} type of resource: script or library
   * @param {string|object} source code or script ID or object
   * @param {object} args Arguments that should be used in the call. For
   *                      example {name: "my_name"}
   * @param {boolean} retry Turns on/off the retries if a resumable
   *                        condition happens
   * @param {function} cb Callback function
   */

  var self = this, uri, form, headers, arg, options, newArguments = [],
    message = 'Failed to create the ' + type + '. First parameter must be' +
              ' a string of source code.';

  for (arg in arguments) {
    newArguments.push(arguments[arg]);
  }
  newArguments = newArguments.slice(1, 5);
  if (arguments.length > 0) {
    options = utils.optionalCUParams(newArguments, message);
    options.sourceCode = sourceCode;
    options = utils.setRetries(options);
    options.type = type;
    options.operation = 'create';
    this.options = options;
  } else {
    options = this.options;
  }
  uri = this.connection.resourceUrls[type] + this.connection.auth;

  form = {source_code: options.sourceCode};
  for (arg in options.args) {
    if (options.args.hasOwnProperty(arg)) {
      form[arg] = options.args[arg];
    }
  }


  axios({
    url          : uri,
    method       : 'POST',
    data         : JSON.stringify(form),
    responseType : "json",
    httpsAgent   : new https.Agent({rejectUnauthorized: constants.VERIFY}),
    headers    : {'Content-Type': 'application/json;charset=utf-8'}
  })
   .then(function (response) {
      var code = constants.HTTP_INTERNAL_SERVER_ERROR,
      result = utils.makeEmptyResult('resource',
                                     code,
                                     'The resource couldn\'t be created');

      return utils.requestResponse('create', self, constants.HTTP_CREATED,
                                   createErrors,
                                   null, response.data, response,
                                   result, options.cb);
      })
   .catch(function (error) {
      var code = constants.HTTP_INTERNAL_SERVER_ERROR,
      result = utils.makeEmptyResult('resource',
                                     code,
                                     'The resource couldn\'t be created');

      return utils.requestResponse('create', self, constants.HTTP_CREATED,
                                   createErrors,
                                   error, undefined, undefined,
                                   result, options.cb);
    })

};


module.exports = BaseScript;
