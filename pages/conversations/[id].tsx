import { async } from "@firebase/util";
import { doc, getDoc, getDocs } from "firebase/firestore";
import { GetServerSideProps } from "next";
import Head from "next/head";
import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import styled from "styled-components";
import ConversationScreen from "../../components/ConversationScreen";
import Sidebar from "../../components/Sidebar";
import { auth, db } from "../../config/firebase";
import { Conversation, IMessage } from "../../types/Conversation";
import {
  generateQueryGetMessages,
  transformMessage,
} from "../../utils/getMessagesInConversation";
import { getRecipientEmail } from "../../utils/getRecipientEmail";

interface Props {
  conversation: Conversation;
  messages: IMessage[];
}

const StyledContainer = styled.div`
  display: flex;
`;

const StyledConversationContainer = styled.div`
  flex-grow: 1;
  overflow: scroll;
  height: 100vh;

  ::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
`;

const ConversationChat = ({ conversation, messages }: Props) => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  return (
    <StyledContainer>
      <Head>
        <title>
          Conversation with{" "}
          {getRecipientEmail(conversation.users, loggedInUser)}
        </title>
      </Head>
      <Sidebar />

      <StyledConversationContainer>
        <ConversationScreen conversation={conversation} messages={messages} />
      </StyledConversationContainer>
    </StyledContainer>
  );
};

export default ConversationChat;

export const getServerSideProps: GetServerSideProps<
  Props,
  { id: string }
> = async (context) => {
  const conversationId = context.params?.id;

  // get conversation, to know who we are chatting with
  const conversationRef = doc(db, "conversations", conversationId as string);
  const conversationSnapshot = await getDoc(conversationRef);

  // get all messages between logged in user and recipient in this conversation
  const queryMessages = generateQueryGetMessages(conversationId);

  console.log(queryMessages);

  const messagesSnapshot = await getDocs(queryMessages);

  const messages = messagesSnapshot.docs.map((messageDoc) =>
    transformMessage(messageDoc)
  );

  console.log("Message ne", messages);

  return {
    props: {
      conversation: conversationSnapshot.data() as Conversation,
      messages,
    },
  };
};
