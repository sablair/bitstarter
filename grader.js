#! /usr/bin/env node

var fs = require('fs')
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var MYFILE = "testing.csv";

var assertFileExists = function(infile){
    var instr = infile.toString();
    if(!fs.existsSync(instr))
    {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }

    return instr;
};

var cheerioHtmlFile = function(htmlfile){
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile){
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile){
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks){
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn){
    return fn.bind({});
};

var processfn = function(){
    var response2console = function (result, response){
	if(result instanceof Error){
	    console.log("File not created");
	    process.exit(1);
	} else {	
	    fs.writeFileSync(MYFILE, result);
	}
    };
    return response2console;
};

if(require.main == module){
    program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <site_url>', 'Site URL')
    .parse(process.argv);

    var file = program.file;
    if(program.url){
	file = MYFILE;
	restler.get(program.url).on('complete', function (result){
	    if(result instanceof Error){
		console.log("Unable to process request");
	    } else {
		fs.writeFileSync(MYFILE, result);
	    }
	});
    }

    var checkJson = checkHtmlFile(file, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
    fs.writeFileSync("output.json", outJson)
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
