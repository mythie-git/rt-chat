// src/App.js
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import styled from "styled-components";

const socket = io("http://localhost:3001");

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 5%;
  font-family: "Arial", sans-serif;
  justify-content: center;
  align-items: center;
`;

const StyledContainer = styled.div`
  border: 5px solid #0f2167;
  height: 80%;
  background-color: #3559e0;
  display: grid;
  grid-template-rows: auto 1fr auto;
`;

const StyledTab = styled.div`
  cursor: pointer;
  padding: 10px;
  text-align: center;
  background-color: ${(props) => (props.active ? "#0F2167" : "#3559E0")};
  color: ${(props) => (props.active ? "white" : "black")};
`;

const Header = styled.h1`
  width: 100%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #3559e0;
  margin: 0;
`;

const LogoImage = styled.img`
  width: 130px;
  height: 60px;
  padding: 30px 30px; 
  margin: 5px 5px auto;
  margin-left: 0;
`;

const Input = styled.input`
  padding: 15px; 
  margin: 15px auto; 
  flex: 1;
  border: none;
  border-radius: 8px; 
  display: flex;
  font-size: 16px;
`;

const FixedInput = styled(Input)`
  flex: 1;
  margin-right: 10px;
`;

const Button = styled.button`
  background-color: #0f2167;
  color: white;
  padding: 15px 30px; 
  border: none;
  border-radius: 8px; 
  cursor: pointer;
  margin: 20px; 
  display: block;
  font-size: 16px; 
  transition: background-color 0.3s;

  &:hover {
    background-color: #4CB9E7;
  }
`;

const RoomButton = styled(Button)`
  margin: 0 5px;
  transition: background-color 0.3s;
  display:block;
  alignItems:'center',
  justifyContent:'center',

  &:hover {
    background-color: #4CB9E7;
  }
`;

const UserButton = styled(Button)`
  margin: 0 5px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #4CB9E7;
  }
`;

const RoomList = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%; /* Sayfanın tam genişliği */
  padding-top: 10px;
  padding-bottom: 10px;
  background-color: #0f2167;
  flex: 3;
`;

const UsersList = styled.div`
  display: flex;
  background-color: #4cb9e7;
  padding: 10px;
  flex: 1;
  flex-direction: row;
`;

const MessageAndInputContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 60vh;
`;

const MessageContainer = styled.div`
  flex: 1;
  overflow-y: scroll;
  padding: 10px;
  background-color: #f0f0f0;
`;

const MessageItem = styled.div`
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 8px;
  background-color: ${({ isCurrentUser }) =>
    isCurrentUser ? "#9BB8CD" : "#EEC759"};
  align-self: ${({ isCurrentUser }) =>
    isCurrentUser ? "flex-end" : "flex-start"};
  color: ${({ isCurrentUser }) => (isCurrentUser ? "#fff" : "#fff")};
`;

const FixedBottomSection = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f0f0f0;
  position: sticky;
  bottom: 0;
`;

function App() {
  const [activeTab, setActiveTab] = useState("login");
  const [loginUsers, setLoginUser] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("Room 1"); // currentRoom'u burada tanımlayın
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState(["Room 1", "Room 2", "Room 3"]);
  const [messages, setMessages] = useState({});
  const [message, setMessage] = useState("");
  const messageContainerRef = useRef(null);


  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        "https://657f1df59d10ccb465d5fdb3.mockapi.io/bolt/users"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setLoginUser(data);
      console.log(loginUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {

  }, [loginUsers]);

  const handleRegister = async () => {
    fetchUsers();
    if (username && password) {
      const isUsernameExist = loginUsers.some(
        (user) => user.username == username
      );
      if (isUsernameExist) {
        alert("Bu kullanıcı adı zaten mevcut");
      } else {
        try {
          const response = await fetch(
            "https://657f1df59d10ccb465d5fdb3.mockapi.io/bolt/users",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username: username,
                password: password,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Network response was not ok");
          }

          const data = await response.json();
          setUsername("");
          setPassword("");
          alert("Kayıt Başarılı");
        } catch (error) {
          console.error("Error during login:", error);
        }
      }
    } else {
      alert("Alanlar Hatalı");
    }
  };

  useEffect(() => {
    const initialMessages = {};
    rooms.forEach((room) => {
      initialMessages[room] = [];
    });
    setMessages(initialMessages);

    socket.on("message", (newMessage) => {
      setMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        const roomMessages = updatedMessages[newMessage.room];

        // Kontrol etme: Aynı mesajın birden çok kez eklenmesini önle
        if (!roomMessages.some((msg) => msg.id === newMessage.id)) {
          roomMessages.push(newMessage);
        }

        return updatedMessages;
      });

      // Mesaj eklendiğinde otomatik olarak en altta görüntülenmesini sağla
      if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }
    });
  }, [rooms]);

  useEffect(() => {
    if (isLoggedIn) {
      rooms.forEach((room) => {
        socket.emit("joinRoom", { username, room });
      });
    }
  }, [isLoggedIn, rooms, username]);

  const handleLogin = () => {
    if (username && password) {
      const isUsernameExist = loginUsers.some(
        (user) => user.username == username && user.password == password
      );
      if (isUsernameExist) {
        setIsLoggedIn(true);
      } else {
        alert("Kullanıcı adı veya şifre yanlış");
      }
      socket.emit("login", { username });
    } else {
      alert("Alanlar hatalı");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);

    socket.emit("logout", { username });
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.username !== username)
    );
  };

  useEffect(() => {

    if (isLoggedIn) {
      socket.emit("login", { username });
    }

    socket.on("users", (onlineUsers) => {
      const uniqueUsers = [
        ...new Set(onlineUsers.map((user) => user.username)),
      ];
      setUsers(uniqueUsers);
    });

  }, [isLoggedIn]);

  const handleSendMessage = () => {
    if (isLoggedIn && message) {
      const messageId = Date.now();
      socket.emit("message", {
        id: messageId,
        username,
        message,
        room: currentRoom,
      });
      setMessage("");
    }
  };

  const switchRoom = (room) => {
    setCurrentRoom(room);
  };

  return (
    <Container>
      {!isLoggedIn ? (
        <StyledContainer>
          <Header>
            <LogoImage
              src="https://www.boltinsight.com/wp-content/uploads/2022/11/bolt-logo.png"
              alt="Logo"
            />
            Bolt Insight   <br />
            RT Chat
          </Header>
          <div style={{ textAlign: "center" }}>
            <StyledTab
              onClick={() => handleTabClick("login")}
              active={activeTab === "login"}
            >
              Giriş Yap
            </StyledTab>
            <StyledTab
              onClick={() => handleTabClick("register")}
              active={activeTab === "register"}
            >
              Kayıt Ol
            </StyledTab>
          </div>
          {activeTab === "login" ? (
            <div>
              <Input
                type="text"
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignSelf: "center",
                  justifyContent: "center",
                }}
              >
                <Button onClick={handleLogin}>Giriş Yap</Button>
              </div>
            </div>
          ) : (
            <div>
              {/* Kayıt olma içeriği */}
              <Input
                type="text"
                placeholder="Kullanıcı Adı"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignSelf: "center",
                  justifyContent: "center",
                }}
              >
                <Button onClick={handleRegister}>Kayıt Ol</Button>
              </div>
            </div>
          )}
        </StyledContainer>
      ) : (
        <div
          style={{
            border: "5px solid #0F2167",
            width: "100%",
            height: "80%",
            backgroundColor: "#0F2167",
          }}
        >
          <Header>
            <LogoImage
              src="https://www.boltinsight.com/wp-content/uploads/2022/11/bolt-logo.png"
              alt="Logo"
            />
            <Button
              style={{ "text-align": "right", display: "inline" }}
              onClick={handleLogout}
            >
              Çıkış Yap
            </Button>
          </Header>
          <RoomList>
            {rooms.map((room) => (
              <RoomButton key={room} onClick={() => switchRoom(room)}>
                {room}
              </RoomButton>
            ))}
          </RoomList>
          <UsersList>
            {users.map((room) => (
              <UserButton key={room}>{room}</UserButton>
            ))}
          </UsersList>

          <MessageAndInputContainer>
            <MessageContainer ref={messageContainerRef}>
              {messages[currentRoom].map((msg, index) => (
                <MessageItem
                  key={index}
                  isCurrentUser={msg.username === username}
                >
                  <strong>{msg.username}:</strong> {msg.message}
                </MessageItem>
              ))}
            </MessageContainer>
            <FixedBottomSection>
              <FixedInput
                type="text"
                placeholder="Mesajınızı yazın"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={handleSendMessage}>Gönder</Button>
            </FixedBottomSection>
          </MessageAndInputContainer>
        </div>
      )}
    </Container>
  );
}

export default App;
