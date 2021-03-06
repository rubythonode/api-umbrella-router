'use strict';

require('../test_helper');

var _ = require('lodash'),
    request = require('request');

describe('url rewrites', function() {
  beforeEach(function() {
    this.options = {
      followRedirect: false,
      strictSSL: false,
    };
  });

  it('performs simple nginx style rewrites on a per host basis', function(done) {
    var options = _.merge({}, this.options, {
      headers: {
        'Host': 'default.foo',
      },
    });
    request.get('http://localhost:9080/hello/rewrite?foo=bar', options, function(error, response) {
      should.not.exist(error);
      response.statusCode.should.eql(301);
      response.headers.location.should.eql('https://example.com/something/?foo=bar');
      done();
    });
  });

  it('performs more complex nginx style rewrites on a per host basis', function(done) {
    var options = _.merge({}, this.options, {
      headers: {
        'Host': 'default.foo',
      },
    });
    request.get('http://localhost:9080/hello/rewrite/el/7/file-0.6.0-1.el7.x86_64.rpm?foo=bar', options, function(error, response) {
      should.not.exist(error);
      response.statusCode.should.eql(302);
      response.headers.location.should.eql('https://example.com/downloads/v0.6.0/file-0.6.0-1.el7.x86_64.rpm');
      done();
    });
  });

  it('rewrites take precendence over potential API matches', function(done) {
    var options = _.merge({}, this.options, {
      headers: {
        'Host': 'with-apis-and-website.foo',
      },
    });
    request.get('http://localhost:9080/example/rewrite_me', options, function(error, response) {
      should.not.exist(error);
      response.statusCode.should.eql(301);
      response.headers.location.should.eql('https://example.com/');

      request.get('http://localhost:9080/example/rewrite_me_just_kidding', options, function(error, response, body) {
        should.not.exist(error);
        response.statusCode.should.eql(403);
        body.should.contain('API_KEY_MISSING');
        done();
      });
    });
  });

  it('rewrites take precendence over potential web admin matches', function(done) {
    var options = _.merge({}, this.options, {
      headers: {
        'Host': 'default.foo',
      },
    });
    request.get('https://localhost:9081/admin/rewrite_me', options, function(error, response) {
      should.not.exist(error);
      response.statusCode.should.eql(301);
      response.headers.location.should.eql('https://example.com/');

      request.get('https://localhost:9081/admin/rewrite_me_just_kidding', options, function(error, response) {
        should.not.exist(error);
        response.statusCode.should.eql(404);
        done();
      });
    });
  });

  it('does not perform rewrites on other hosts', function(done) {
    var options = _.merge({}, this.options, {
      headers: {
        'Host': 'withweb.foo',
      },
    });
    request.get('http://localhost:9080/hello/rewrite?foo=bar', options, function(error, response) {
      should.not.exist(error);
      response.statusCode.should.eql(404);
      done();
    });
  });
});
