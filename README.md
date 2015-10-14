# StatsD flexible backend 

## Overview
This is a pluggable backend for [StatsD](https://github.com/etsy/statsd), which
reacts to statsd events.

## Installation

simply checkout in your node_modules folder (npm install option coming later) and npm install your project.

## Configuration
To use the backend, add this to your config.js:

``` javascript
, backends: [ "statsd-flex-backend" ]
, flexbackend: require('../flex-backend-config.js')
```

the configuration can then be made in the `flex-backend-config.js` file:

```javascript
var mean_number_of_registrations = 1000000;
var mean_number_of_member_upgrades = 10000;
var mean_number_of_purchases = 1000;

var request = require('request');

module.exports = {
    events: [
        {regex: /.*partnerRequestSent.*/
            , exec: function() {
                request('http://blink1-server:8754/blink1/blink?rgb=%23ff0000&ledn=1&repeats=1');
                // blink once in red when a new partnerrequest is sent
            }
        }
        , {regex: /.*newRegistration.*/
            , exec: function() {
                request('http://blink1-server:8754/blink1/blink?rgb=%230000ff&ledn=1&repeats=1');
                // blink once in blue when a new user registers on the platform
            }
        }
    ]
        , buckets: [
    {name: 'registration'
        , regex: /.*newRegistration.*/
        , halflive: 1000 * 60 * 60 * 24
    }
    , {name: 'memberStatus'
        , regex: /.*upgradeToMemberStatus.*/
        , halflive: 1000 * 60 * 60 * 24
    }
    , {name: 'purchase'
        , regex: /.*purchasePremium.*/
        , halflive: 1000 * 60 * 60 * 24
    }
]
    , background: function(bucketMap) {
        var r = Math.min(255, Math.floor(128 * (bucketMap.registration | 0 / mean_number_of_registrations)));
        var g = Math.min(255, Math.floor(128 * (bucketMap.memberStatus | 0 / mean_number_of_member_upgrades)));
        var b = Math.min(255, Math.floor(128 * (bucketMap.purchase | 0 / mean_number_of_purchases)));
        // calculate the health status color from the number of registrations, member upgrades and premium purchases
        var rgb = Number(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).substring(1);
        request('http://blink1-server:8754/blink1/fadeToRGB?rgb=%23' + rgb + '&time=2.5&ledn=2');
    }
};
```
Events are fired as soon as they are received by the statsd-server for each regex that matches the event. Buckets are 
updated after each flush interval. After the flush, the background function is executed. The `halflive`-parameter can be used to discount metrics and calculate a time-weighted average value. After `halflive` milliseconds one event is only worth 0.5. Events and background functions can take the bucketMap as a parameter to include metrics in whatever they do.
