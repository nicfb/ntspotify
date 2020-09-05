const api = 'http://localhost:3001';

function GetTracksFromShow() {
    document.getElementById('tracks').innerHTML = '';
    const title = document.getElementById('playlistTitle').value;
    const desc = document.getElementById('playlistDesc').value;
    const link = document.getElementById('showLink').value;
    if (title === '' || link === '')
    {
        alert('Title and show URL cannot be empty.');
        return;
    }

    fetch(api + '/getTracks?url=' + link, {
        method: 'GET'
    }).then(resp => resp.json())
    .then(tracks => {
        fetch(api + '/me', {
            method: 'GET'
        }).then(resp => resp.json())
        .then(data => {
            const userID = data.body.id;
            CreatePlaylist(userID, title, desc, tracks);
        })
    })
    .catch(err => console.log(err));
}

function CreatePlaylist(userID, title, desc, tracks) {
    console.log(tracks);
    fetch(api + '/createPlaylist/' + encodeURI(userID), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playlist: {
                title: title,
                desc: desc,
                publicPrivate: document.getElementById('public').checked
            }
        })
    }).then(resp => resp.json())
    .then(data => {
        let playlistID = data.id;
        console.log(playlistID);
        tracks.forEach(t => {
            //TODO: handle special case for track not found
            fetch(api + '/search/' + t.title + ' ' + t.artist, {
                method: 'GET'
            }).then(resp => resp.json())
            .then(data => {
                console.log(data);
                let track = data.tracks.items[0];
                console.log(track.name + ' ' + track.id);
                fetch(api + '/addToPlaylist/' + playlistID + '/' + track.id, {
                    method: 'POST'
                }).then(resp => resp.json())
                .then(data => {
                    console.log(data);
                })
            }).catch(err => console.log(err));
        });
    }).then(() => {
        //TODO: show this after entire playlist is created
        alert('Playlist created.');
    });
}