let currentsong = new Audio();
let play = document.getElementById("play");
let previous = document.getElementById("prev");
let next = document.getElementById("next");
let songs = [];
let currfolder;
let currentSongindex = -1;
let controlsInitialized = false; // <-- prevent duplicate control event listeners



async function getsong(folder) {
    currfolder = folder;
    let response = await fetch(`http://127.0.0.1:5501/${currfolder}`);
    let data = await response.text();
    let div = document.createElement("div");
    div.innerHTML = data;

    const listItems = div.querySelectorAll('li');
    songs = []; // Clear previous songs
    listItems.forEach(item => {
        const aTag = item.querySelector('a');
        if (aTag && aTag.href.endsWith('.mp3')) {
            songs.push(aTag.href.split(`/${currfolder}/`)[1]);
        }
    });
    // console.log(mp3Links);  // give song list..

    // show all the songs in playlist
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songul.innerHTML = "";
    for (const e of songs) {
        songul.innerHTML += ` <li><img src="music.svg" alt="" class="invert">
                        <div class="info">
                            <div class="name">${e.replaceAll("%20", " ")}</div>
                        </div>
                        <div class="playnow">
                            <span>Play Now</span>
                            <img src="playnow.svg" alt="">
                        </div>
                       </li>`;
    }

    let selectli = Array.from(document.querySelector(".songlist").getElementsByTagName("li"));
    selectli.forEach((e, index) => {
        e.addEventListener("click", () => {
            let songname = e.querySelector("div").firstElementChild.innerHTML;
            currentSongindex = index; // Update index on manual song click
            playtack(songname);
        });
    });

    // event on click side bar
    addeventonsidebarsong();
}

async function playsong() {
    // dynamically disply.. all albums..
    displayalbums();
}

playsong();



function addeventonsidebarsong() {
    // update time .. when it is play..
    currentsong.addEventListener("timeupdate", () => {
        // console.log(currentsong.currentTime , currentsong.duration);
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentsong.currentTime)}: ${secondsToMinutesSeconds(currentsong.duration)}`;

        // for seekbar..(left move)
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + `%`;
    });

    // for moving seekbar.. by user..
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + `%`;
        // update time.. when changing circle.
        currentsong.currentTime = (currentsong.duration * percent) / 100;
    });

    // hamburger 
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
        document.querySelector(".close").style.display = "block";
    });

    // close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
        document.querySelector(".close").style.display = "none";
    });

    // controlsInitialized  skips re-attaching listeners..
    if (!controlsInitialized) {
        previous.addEventListener("click", () => {
            if (currentSongindex > 0) {
                currentSongindex--;
                playtack(songs[currentSongindex]);
            }
        });

        next.addEventListener("click", () => {
            if (currentSongindex < songs.length - 1) {
                currentSongindex++;
                playtack(songs[currentSongindex]);
            }
        });

        // volume button..
        document.querySelector(".volume").addEventListener("change", (e) => {
            currentsong.volume = (e.target.value) / 100;
        });

        controlsInitialized = true; // <-- prevent adding multiple listeners
    }

}

function playtack(track) {
    currentsong.src = `/${currfolder}/` + track;
    currentsong.play();
    play.src = "pausee.svg";

    document.querySelector(".songinfo").innerHTML = track.replaceAll("%20", " ").replace(".mp3" , "");
    document.querySelector(".songtime").innerHTML = " ";
}

play.addEventListener("click", () => {
    if (currentsong.paused) {
        currentsong.play();
        play.src = "pausee.svg";
    } else {
        currentsong.pause();
        play.src = "playy.svg";
    }
});

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}


  async function displayalbums() {
    let response = await fetch(`http://127.0.0.1:5501/songs/`);
    let data = await response.text();

    let div = document.createElement("div");
    div.innerHTML = data;

    const listItems = div.querySelectorAll('li');
    const cardcontainer = document.querySelector(".cardcontainer");
    cardcontainer.innerHTML = ""; // Clear previous cards

    for (const item of listItems) {
        const aTag = item.querySelector('a');
        if (aTag && aTag.href.includes('/songs/')) {
            let folder = aTag.href.split("/songs/")[1].replace(/\/$/, ""); // remove trailing slash if any
            let response = await fetch(`http://127.0.0.1:5501/songs/${folder}/info.json`);
            if (!response.ok) continue;
            let data = await response.json();

            cardcontainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <img src="/songs/${folder}/cover.png" alt="Image">
                    <p>${data.title}</p>
                </div>
            `;
        }
    }
        // load playlist whenever card is clicked..
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (ele) => {
            // console.log(ele.currentTarget.dataset.folder);     
            await getsong(`songs/${ele.currentTarget.dataset.folder}`);
        });
    });
}
