var GoogleMapsAPI = require('googlemaps');
var fs = require('fs');

var records = require('./unitedstates.js')

var publicConfig = {
    key: 'AIzaSyBo-tnlA0XQvTzmXtRP9CESF5H--KuzgK4',
    stagger_time: 1000, // for elevationPath
    encode_polylines: false,
    secure: true, // use https
};

var gmAPI = new GoogleMapsAPI(publicConfig);

// connecting to Mongodb database running instance
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;

// connect to the flights database in mongodb
var mongourl = 'mongodb://localhost:27017/flights';

var citiesToLoc = {};

records.cities1000Map.forEach(function (d) {

    var c = d["city"];
    c = c.replace(", USA", "");
    var loc = d["ll"].split(",");
    citiesToLoc[c] = [parseFloat(loc[0]), parseFloat(loc[1])];
});

var cities = [
 "Fort Lauderdale, FL",
 "College Station, TX",
 "West Palm Beach, FL",
 "Charlottesville, VA",
 "Salt Lake City, UT",
 "Jacksonville, FL",
 "Atlantic City, NJ",
 "Philadelphia, PA",
 "San Francisco, CA",
 "Oklahoma City, OK",
 "Bowling Green, KY",
 "State College, PA",
 "Cleveland, OH",
 "Anchorage, AK",
 "Baltimore, MD",
 "Charlotte, NC",
 "Champaign, IL",
 "Asheville, NC",
 "Knoxville, TN",
 "La Crosse, WI",
 "Richmond, VA",
 "New York, NY",
 "Rockford, IL",
 "Waterloo, IA",
 "Savannah, GA",
 "Los Angeles, CA",
 "Minneapolis, MN",
 "New Orleans, LA",
 "San Antonio, TX",
 "Wilmington, OH",
 "Washington, DC",
 "Baton Rouge, LA",
 "Gainesville, FL",
 "Albuquerque, NM",
 "Tuscaloosa, AL",
 "Little Rock, AR",
 "Kansas City, MO",
 "Indianapolis, IN",
 "Grand Rapids, MI",
 "Cedar Rapids, IA",
 "Tallahassee, FL",
 "Houston, TX",
 "Atlanta, GA",
 "Augusta, GA",
 "Chicago, IL",
 "Detroit, MI",
 "El Paso, TX",
 "Memphis, TN",
 "Orlando, FL",
 "Oakland, CA",
 "Killeen, TX",
 "Jackson, MS",
 "Lubbock, TX",
 "Key West, FL",
 "Columbus, OH",
 "Hartford, CT",
 "Columbia, SC",
 "Phoenix, AZ",
 "Raleigh, NC",
 "Roanoke, VA",
 "Seattle, WA",
 "Columbia, MO",
 "Columbus, GA",
 "Nashville, TN",
 "Milwaukee, WI",
 "Las Vegas, NV",
 "Manhattan, KS",
 "Lexington, KY",
 "San Diego, CA",
 "Pensacola, FL",
 "Pittsburgh, PA",
 "Providence, RI",
 "Greenville, SC",
 "Cincinnati, OH",
 "Greensboro, NC",
 "Huntsville, AL",
 "St. Louis, MO",
 "Fort Wayne, IN",
 "Charleston, SC",
 "Alexandria, LA",
 "Montgomery, AL",
 "Evansville, IN",
 "Harrisburg, PA",
 "Tampa, FL",
 "Miami, FL",
 "Bangor, ME",
 "Albany, GA",
 "Tulsa, OK",
 "Ocala, FL",
 "Akron, OH",
 "Dover, DE",
 "Boston, MA",
 "Dallas, TX",
 "Naples, FL",
 "Laredo, TX",
 "Dayton, OH",
 "Monroe, LA",
 "Newark, NJ",
 "Toledo, OH",
 "Tupelo, MS",
 "Tacoma, WA",
 "Sumter, SC",
 "Omaha, NE",
 "Gary, IN",
 "Helena, MT",
 "Wilmington, NC",
 "Shreveport, LA",
 "Wilmington, DE",
 "Scranton, PA",
 "Syracuse, NY",
 "Lafayette, LA",
 "Johnstown, PA",
 "Birmingham, AL",
 "Greenville, NC",
 "Des Moines, IA",
 "Greenville, MS",
 "Rochester, NY",
 "Buffalo, NY",
 "Trenton, NJ",
 "Madison, WI",
 "Gulfport, MS",
 "Billings, MT",
 "Columbus, MS",
 "Anderson, SC",
 "Colorado Springs, CO",
 "Myrtle Beach, SC",
 "Corpus Christi, TX",
 "Santa Barbara, CA",
 "Muncie, IN",
 "Clovis, NM",
 "Mobile, AL",
 "Topeka, KS",
 "Athens, GA",
 "Austin, TX",
 "Albany, NY",
 "Waco, TX",
 "Ogden, UT",
 "Youngstown, OH",
 "Santa Rosa, CA",
 "Hot Springs, AR",
 "Fayetteville, NC",
 "Fayetteville, AR",
 "Fairbanks, AK",
 "Allentown, PA",
 "Valdosta, GA",
 "Las Cruces, NM",
 "Fort Smith, AR",
 "Manchester, NH",
 "Clarksburg, WV",
 "Erie, PA",
 "Macon, GA",
 "Kearney, NE",
 "Kinston, NC",
 "Columbia, TN",
 "Stillwater, OK",
 "Sacramento, CA",
 "Grand Island, NE",
 "Abilene, TX",
 "Paducah, KY",
 "Honolulu, HI",
 "Lakeland, FL",
 "Worcester, MA",
 "Tucson, AZ",
 "Dothan, AL",
 "Elmira, NY",
 "Fresno, CA",
 "Warrensburg, MO",
 "Springfield, MO",
 "Lake Charles, LA",
 "Santa Fe, NM",
 "Staunton, VA",
 "Lake City, FL",
 "South Bend, IN",
 "Brownsville, TX",
 "Kalamazoo, MI",
 "Portland, OR",
 "San Jose, CA",
 "Portland, ME",
 "Montrose, CO",
 "New Bern, NC",
 "Spokane, WA",
 "Burlington, VT",
 "Santa Ana, CA",
 "Rochester, MN",
 "Reno, NV",
 "Minot, ND",
 "Rutland, VT",
 "Wichita, KS",
 "Florence, SC",
 "Lansing, MI",
 "Green Bay, WI",
 "Rocky Mount, NC",
 "Bridgeport, CT",
 "Peoria, IL",
 "Ithaca, NY",
 "Saginaw, MI",
 "Plattsburgh, NY",
 "Lancaster, PA",
 "Appleton, WI",
 "Fargo, ND",
 "Hattiesburg, MS"
];

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

cities.forEach(function (d) {

    if (!citiesToLoc[d]) {

        var geocodeParams = {
            "address": d,
            "language": "en",
            "region": "usa"
        };

        gmAPI.geocode(geocodeParams,

            function (err, result) {

                console.log(result);

                citiesToLoc[d] = result["results"][0].geometry.location;
                
                writeToFile({
                    city: d,
                    ll: [citiesToLoc[d].lat, citiesToLoc[d].lng] 
                });

                sleep(100);
            });

    } else {

        writeToFile({
            city: d,
            ll: citiesToLoc[d]
        });
    }

});


function writeToFile(data) {
    console.log(data);

    fs.appendFile('public/data/locations.json', JSON.stringify(data) + "\n",

        function (err) {
            if (err) throw err;
            console.log('userlog.csv was written');
        });
}

exports.citiesToLoc = citiesToLoc;