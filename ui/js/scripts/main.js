import { Ripple } from '../modules/ripple.js';
const { electronAPI } = window;
let proxy = "roblox"

async function Init() {
  document.getElementById('webhook').textContent = await UpdateWebhookName();
  new Ripple('.add-user-btn');
  new Ripple('.imgbutton');
  InitializeUsers();
  const userData = await ReadUserData();
  SendWebhookMessage(userData.webhook_token,
  {
    title: 'StalkerHook Initialized!',
  });
  setInterval(UpdateAllUsers, 3000);
}

async function UpdateWebhookName() {
  const userData = await ReadUserData();
  const response = await fetch(userData.webhook_token);
  const data = await response.json();
  let webhookName = data.name;
  
  if (webhookName.length > 16) {
    return webhookName.substring(0, 14) + ".."
  }
  return webhookName
}

async function WriteUserData(data) {
  await electronAPI.WriteUserData(data);
}

async function ReadUserData() {
  return await electronAPI.ReadUserData();
}

async function UpdateUserData(action, userid) {
  let userData = await ReadUserData();
  
  if (!userData) {
    userData = { userIds: [] };
  }
  
  if (!Array.isArray(userData.userIds)) {
    userData.userIds = [];
  }

  if (action === 'add' && !userData.userIds.includes(userid)) {
    userData.userIds.push(userid);
  } else if (action === 'delete' && userData.userIds.includes(userid)) {
    userData.userIds = userData.userIds.filter(id => id !== userid);
  }

  await WriteUserData(userData);
}

async function InitializeUsers() {
  const userData = await ReadUserData();
  if (userData && userData.userIds) {
    userData.userIds.forEach(async (userid) => {
      const info = await GetUserInfo(userid);
      if (info) {
        CreateUser(info(0), info(1), info(2), userid, info(3));
        setInterval(await UpdateUserWithId(userid), 3000);
      }
    });
  }
}

async function GetUserPresence(userid) {
  const URL = `https://presence.${proxy}.com/v1/presence/users`;
  
  const body = JSON.stringify({
      userIds: [userid]
  });

  const response = await fetch(URL, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: body
  });

  if (response.ok) {
    const content = await response.json();
    const presenceTypeCode = content.userPresences[0].userPresenceType;

    const presenceMap = {
        0: "Offline",
        1: "Web",
        2: "Online",
        3: "Studio",
        4: "Invisible"
    };
    const presenceType = presenceMap[presenceTypeCode] || "Unknown";

    return presenceType;
  } else {
      return false;
  }
}

async function GetHeadshot(userid) {
  const headshotResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userid}&size=420x420&format=Png&isCircular=false`);
  if (!headshotResponse.ok) {
    return false;
  }
  const headshot = await headshotResponse.json();
  return headshot.data[0].imageUrl;
}

async function GetUserInfo(userid) {
  const userinfoResponse = await fetch(`https://users.${proxy}.com/v1/users/${userid}`);
  const userinfo = await userinfoResponse.json();
  if (userinfoResponse.status == 405) {
    return '405';
  } else if (userinfoResponse.status == 404) {
    return '404';
  } else if (userinfoResponse.status != 200 && userinfoResponse.status != 404 && userinfoResponse.status != 405) {
    return 'what';
  }

  const strings = [
    userinfo.displayName,
    await GetUserPresence(userid),
    await GetHeadshot(userid),
    userinfo.name,
  ];

  return index => strings[index];
}

async function UpdateUserWithId(userid) {
  const info = await GetUserInfo(userid);
  await UpdateUser(info(0), info(1), info(2), userid, info(3));
}

async function UpdateAllUsers() {
  const userData = await ReadUserData();
  if (userData && userData.userIds) {
    userData.userIds.forEach(async (userid) => {
      const info = await GetUserInfo(userid);
      if (info) {
        UpdateUserWithId(userid);
      }
    });
  }
}

async function SendWebhookMessage(webhook, embed) {
  const body = JSON.stringify({
    embeds: [embed]
  });

  await fetch(webhook, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body
  });
}

async function UpdateUser(name, status, profilelink, userid, fulluser) {
  const userDiv = document.getElementById(userid);
  const currentStatus = userDiv.querySelector(`#${CSS.escape(userid)}-status`).textContent;
  if (currentStatus !== status) {
    const userData = await ReadUserData();
    const webhookUrl = userData.webhook_token;
    const embed = CreateEmbed(name, userid, status, fulluser, profilelink);
    await SendWebhookMessage(webhookUrl, embed);
  }
  if (userDiv) {
    const avatarImg = userDiv.querySelector('.avatar');
    if (avatarImg) {
      avatarImg.src = profilelink;
    }

    const statusImg = userDiv.querySelector('.status');
    if (statusImg) {
      statusImg.src = `../assets/${status.toLowerCase()}.png`;
    }

    const statusText = userDiv.querySelector(`#${CSS.escape(userid)}-status`);
    if (statusText) {
      statusText.textContent = status;
    }

    const displayNameText = userDiv.querySelector(`#${CSS.escape(userid)}-displayname`);
    if (displayNameText) {
      displayNameText.textContent = name;
    }

    const usernameText = userDiv.querySelector(`#${CSS.escape(userid)}-username`);
    if (usernameText) {
      usernameText.textContent = fulluser;
    }
  }
}

function CreateEmbed(name, userid, status, username, profilelink) {
  return {
    title: `${name}'s Update`,
    thumbnail: {
      url: profilelink
    },
    fields: [
      {
        name: 'User ID',
        value: userid,
        inline: true
      },
      {
        name: 'Status',
        value: status,
        inline: true
      },
      {
        name: 'Username',
        value: username,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };
}

function CreateUser(name, status, profilelink, userid, fulluser) {
  if (name.length > 14) {
    name = name.substring(0, 12) + ".."
  }
  const userDiv = document.createElement('div');
  userDiv.className = 'user';
  userDiv.id = userid;

  const avatarImg = document.createElement('img');
  avatarImg.className = 'avatar';
  avatarImg.src = profilelink;
  userDiv.appendChild(avatarImg);

  const infoDiv = document.createElement('div');
  infoDiv.className = 'user-content'
  infoDiv.id = `${userid}-content`

  const displayname = document.createElement('h1');
  displayname.id = `${userid}-displayname`;
  displayname.textContent = name;
  infoDiv.appendChild(displayname);

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-btn';
  deleteButton.id = `${userid}-delete`
  const icon = document.createElement('i');
  icon.className = 'material-symbols-outlined delete-btn-icon';
  icon.id = `${userid}-delete`;
  icon.textContent = 'close';
  deleteButton.appendChild(icon);

  const userinfo = document.createElement('div');
  userinfo.className = 'userinfo';

  const usertext = document.createElement('p');
  usertext.className = 'usertext';
  const statusImg = document.createElement('img');
  statusImg.className = 'status';
  statusImg.src = `../assets/${status.toLowerCase()}.png`;
  usertext.appendChild(statusImg);

  const statusText = document.createElement('span');
  statusText.id = `${userid}-status`;
  statusText.textContent = status;
  usertext.appendChild(statusText);

  const separator1 = document.createElement('text');
  separator1.textContent = ' • ';
  usertext.appendChild(separator1);

  const useridContent = document.createElement('text');
  useridContent.textContent = userid;
  usertext.appendChild(useridContent);

  const separator2 = document.createElement('text');
  separator2.textContent = ' • ';
  usertext.appendChild(separator2);

  const usernameText = document.createElement('text');
  usernameText.textContent = fulluser;
  usernameText.id = `${userid}-username`;
  usertext.appendChild(usernameText);

  infoDiv.appendChild(deleteButton);
  userinfo.appendChild(usertext);
  infoDiv.appendChild(userinfo);
  userDiv.appendChild(infoDiv);

  document.getElementById('users').appendChild(userDiv);
  UpdateUserData('add', userid);
}

function DeleteUser(userid) {
  document.getElementById(userid).remove();
  UpdateUserData('delete', userid);
}

document.getElementById('logout').addEventListener('click', async function() {
  await WriteUserData({ webhook_token: null });
  setTimeout(() => {
    electronAPI.openLoginWindow();
  }, 330);
});

document.getElementById('add-user-btn').addEventListener('click', async function() {
  const userid = document.getElementById('add-user').value;
  const info = await GetUserInfo(userid);

  if (info == '405') {
    document.getElementById('usererror').innerText = 'Please enter something';
  } else if (info == '404') {
    document.getElementById('usererror').innerText = 'Player not found';
  } else if (info == 'what') {
    document.getElementById('usererror').innerText = 'Something went wrong';
  }

  if (document.getElementById(userid)) {
    document.getElementById('usererror').innerText = 'Player already exists in the list';
  } else if (document.getElementsByClassName('user').length >= 3) {
    document.getElementById('usererror').innerText = 'You can only have 3 users max';
  } else {
    CreateUser(info(0), info(1), info(2), userid, info(3));
  }
});

document.getElementById('users').addEventListener('click', async function(event) {
  if (event.target.classList.contains('delete-btn') || event.target.classList.contains('delete-btn-icon')) {
    const userid = event.target.id.replace('-delete', '');
    await DeleteUser(userid);
  }
});

await Init();