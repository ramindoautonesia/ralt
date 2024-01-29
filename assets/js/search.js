var fuseOptions = {
shouldSort: true,
threshold: 0.6,
ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
        {name: "title", weight: 0.5},
        {name: "contents", weight: 0.8},
        {name: "categories", weight: 0.8}
    ]
};

var show = function (elem) {
    elem.style.display = 'block';
};
var hide = function (elem) {
    elem.style.display = 'none';
};

var inputBox = document.getElementById('search-query');
if (inputBox !== null) {
    var searchQuery = param("query");
    if (searchQuery) {
        inputBox.value = searchQuery || "";
        executeSearch(searchQuery, false);
    } else {
        document.getElementById('search-results').innerHTML = '<div class="row text-center"><div class="col-md-12"><p class="search-results-empty">Please enter a word or phrase in the search bar, or see <a href="/categories/">all categories</a>.</p></div></div>';
    }
}

function executeSearch(searchQuery) {

    show(document.querySelector('.search-loading'));

    fetch('/index.json').then(function (response) {
        if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' + response.status);
            return;
        }
        // Examine the text in the response
        response.json().then(function (pages) {
            var fuse = new Fuse(pages, fuseOptions);
            var result = fuse.search(searchQuery);
            if (result.length > 0) {
                populateResults(result);
            } else {
                document.getElementById('search-results').innerHTML = '<div class="row text-center"><div class="col-md-12"><p class=\"search-results-empty\">No matches found</p></div></div>';
            }
            hide(document.querySelector('.search-loading'));
        })
        .catch(function (err) {
            console.log('Fetch Error :-S', err);
        });
    });
}

function populateResults(results) {

    var searchQuery = document.getElementById("search-query").value;
    var searchResults = document.getElementById("search-results");

    // pull template from hugo template definition
    var templateDefinition = document.getElementById("search-result-template").innerHTML;
    var rIndex = 0;
    var outText = "";
    
    var uniqueTitles = [];
    var uniqueResults = [];
    results.forEach(function (value, key){
        if (!uniqueTitles.includes(value.item.title)) {
            uniqueTitles.push(value.item.title);
            uniqueResults.push(value);
        }
    });
    uniqueResults.forEach(function (value) {
        rIndex++;
        var output = render(templateDefinition, {
            title: value.item.title,
            link: value.item.link,
            coverImage: value.item.coverImage,
        });
        if (rIndex % 3 == 1)
        {
            if (rIndex > 1)
            {
                outText += '<div class="gap-60"></div>';
            }
            outText += '<div class="row text-center">';

        }

        outText += output;

        if  ((rIndex % 3 == 0) || (rIndex == uniqueResults.length))
        {
            outText += '</div>';
        }
    });
    searchResults.innerHTML = outText;
}

function param(name) {
    return decodeURIComponent((location.search.split(name + '=')[1] || '').split('&')[0]).replace(/\+/g, ' ');
}

function render(templateString, data) {
    var conditionalMatches, conditionalPattern, copy;
    conditionalPattern = /\$\{\s*isset ([a-zA-Z]*) \s*\}(.*)\$\{\s*end\s*}/g;
    //since loop below depends on re.lastInxdex, we use a copy to capture any manipulations whilst inside the loop
    copy = templateString;
    while ((conditionalMatches = conditionalPattern.exec(templateString)) !== null) {
        if (data[conditionalMatches[1]]) {
            //valid key, remove conditionals, leave contents.
            copy = copy.replace(conditionalMatches[0], conditionalMatches[2]);
        } else {
            //not valid, remove entire section
            copy = copy.replace(conditionalMatches[0], '');
        }
    }
    templateString = copy;
    //now any conditionals removed we can do simple substitution
    var key, find, re;
    for (key in data) {
        find = '\\$\\{\\s*' + key + '\\s*\\}';
        re = new RegExp(find, 'g');
        templateString = templateString.replace(re, data[key]);
    }
    return templateString;
}
