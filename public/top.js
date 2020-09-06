const api = 'http://localhost:3002';

function RefreshTop() {
    var timeRange = document.getElementById('timeRange').value;
    GetTopArtists(timeRange);
    GetTopTracks(timeRange);
}

function GetTopArtists(timeRange) {
    if (timeRange == '') return;
    fetch(api + '/artists/' + timeRange)
    .then(resp => resp.json())
    .then(data => {
        console.log(data);
        DisplayTopArtists(data);
    })
}

function GetTopTracks(timeRange) {
    if (timeRange == '') return;
    fetch(api + '/tracks/' + timeRange)
    .then(resp => resp.json())
    .then(data => {
        console.log(data);
        DisplayTopTracks(data);
    })
}

function DisplayTopArtists(data) {
    document.getElementById('artistImgs').innerHTML = '';
    document.getElementById('artistNames').innerHTML = '';
    data.items.forEach((artist, i) => {
        var div = document.createElement('div');
        div.id = 'artist';
        div.className = 'artist';

        var artistImage = document.createElement('img');
        artistImage.id = 'imgColumn';
        artistImage.setAttribute('width', '256')
        artistImage.setAttribute('height', '256');
        artistImage.setAttribute('src', artist.images[1].url);

        div.appendChild(artistImage);
        document.getElementById('artistImgs').appendChild(div);
    });
}

function DisplayTopTracks(data) {
    document.getElementById('trackImgs').innerHTML = '';
    document.getElementById('trackNames').innerHTML = '';
    data.items.forEach((track, i) => {
        var div = document.createElement('div');
        var trackName = document.createElement('p');
        trackName.innerHTML = track.name;
        div.appendChild(trackName);
        document.getElementById('trackImgs').appendChild(div);
    });
}
