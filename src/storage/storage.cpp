#include "storage/storage.hpp"

#include <stdexcept>

#include <userver/components/component.hpp>
#include <userver/formats/bson/inline.hpp>
#include <userver/formats/bson/types.hpp>
#include <userver/formats/json/value_builder.hpp>
#include <userver/storages/mongo/component.hpp>
#include <userver/storages/mongo/exception.hpp>
#include <userver/storages/mongo/options.hpp>
#include <userver/utils/datetime.hpp>

#include "errors.hpp"

namespace messenger::storage {

namespace {

using userver::formats::bson::MakeArray;
using userver::formats::bson::MakeDoc;
namespace mongo_options = userver::storages::mongo::options;

std::string ExternalId(const char* prefix, std::int64_t id) {
  return std::string(prefix) + std::to_string(id);
}

User DocToUser(const userver::formats::bson::Document& doc) {
  const auto seq = doc["seq_id"].As<std::int64_t>();
  return User{
      .id = ExternalId("user-", seq),
      .login = doc["login"].As<std::string>(),
      .first_name = doc["first_name"].As<std::string>(),
      .last_name = doc["last_name"].As<std::string>(),
      .password_hash = doc["password_hash"].As<std::string>(),
      .created_at = doc["created_at"].As<std::chrono::system_clock::time_point>(),
  };
}

GroupChat DocToGroupChat(const userver::formats::bson::Document& doc) {
  const auto seq = doc["seq_id"].As<std::int64_t>();
  const auto creator = doc["created_by_id"].As<std::int64_t>();
  return GroupChat{
      .id = ExternalId("chat-", seq),
      .name = doc["name"].As<std::string>(),
      .created_by_id = ExternalId("user-", creator),
      .created_at = doc["created_at"].As<std::chrono::system_clock::time_point>(),
  };
}

GroupMessage DocToGroupMessage(const userver::formats::bson::Document& doc) {
  const auto seq = doc["seq_id"].As<std::int64_t>();
  const auto chat_id = doc["chat_id"].As<std::int64_t>();
  const auto sender_id = doc["sender_id"].As<std::int64_t>();
  return GroupMessage{
      .id = ExternalId("gmsg-", seq),
      .chat_id = ExternalId("chat-", chat_id),
      .sender_id = ExternalId("user-", sender_id),
      .content = doc["content"].As<std::string>(),
      .created_at = doc["created_at"].As<std::chrono::system_clock::time_point>(),
  };
}

P2PMessage DocToP2PMessage(const userver::formats::bson::Document& doc) {
  const auto seq = doc["seq_id"].As<std::int64_t>();
  const auto sender_id = doc["sender_id"].As<std::int64_t>();
  const auto recipient_id = doc["recipient_id"].As<std::int64_t>();
  return P2PMessage{
      .id = ExternalId("pmsg-", seq),
      .sender_id = ExternalId("user-", sender_id),
      .recipient_id = ExternalId("user-", recipient_id),
      .content = doc["content"].As<std::string>(),
      .created_at = doc["created_at"].As<std::chrono::system_clock::time_point>(),
  };
}

userver::formats::bson::Document RegexContains(const std::string& mask) {
  return MakeDoc("$regex", mask, "$options", "i");
}

}

userver::formats::json::Value UserToJson(const User& user) {
  userver::formats::json::ValueBuilder b;
  b["id"] = user.id;
  b["login"] = user.login;
  b["first_name"] = user.first_name;
  b["last_name"] = user.last_name;
  b["created_at"] = userver::utils::datetime::Timestring(user.created_at);
  return b.ExtractValue();
}

userver::formats::json::Value GroupChatToJson(const GroupChat& chat) {
  userver::formats::json::ValueBuilder b;
  b["id"] = chat.id;
  b["name"] = chat.name;
  b["created_by_id"] = chat.created_by_id;
  b["created_at"] = userver::utils::datetime::Timestring(chat.created_at);
  return b.ExtractValue();
}

userver::formats::json::Value GroupMessageToJson(const GroupMessage& msg) {
  userver::formats::json::ValueBuilder b;
  b["id"] = msg.id;
  b["chat_id"] = msg.chat_id;
  b["sender_id"] = msg.sender_id;
  b["content"] = msg.content;
  b["created_at"] = userver::utils::datetime::Timestring(msg.created_at);
  return b.ExtractValue();
}

userver::formats::json::Value P2PMessageToJson(const P2PMessage& msg) {
  userver::formats::json::ValueBuilder b;
  b["id"] = msg.id;
  b["sender_id"] = msg.sender_id;
  b["recipient_id"] = msg.recipient_id;
  b["content"] = msg.content;
  b["created_at"] = userver::utils::datetime::Timestring(msg.created_at);
  return b.ExtractValue();
}

MessengerStorage::MessengerStorage(const userver::components::ComponentConfig& config,
                                   const userver::components::ComponentContext& context)
    : ComponentBase(config, context) {
  const auto component_name = config["mongo-component"].As<std::string>("mongo-database");
  pool_ = context.FindComponent<userver::components::Mongo>(component_name).GetPool();
}

std::int64_t MessengerStorage::NextSeqId(const char* counter_name) {
  auto counters = pool_->GetCollection("counters");
  const auto result = counters.FindAndModify(
      MakeDoc("_id", counter_name),
      MakeDoc("$inc", MakeDoc("seq", static_cast<std::int64_t>(1))),
      mongo_options::Upsert{}, mongo_options::ReturnNew{});
  const auto doc = result.FoundDocument();
  if (!doc) {
    throw std::runtime_error("counter increment failed");
  }
  return (*doc)["seq"].As<std::int64_t>();
}

std::int64_t MessengerStorage::ParseEntityId(const std::string& external_id,
                                               const char* prefix) {
  const std::string expected{prefix};
  if (external_id.size() <= expected.size() ||
      external_id.compare(0, expected.size(), expected) != 0) {
    throw errors::ClientError(errors::Msg("Invalid identifier format"));
  }
  try {
    return std::stoll(external_id.substr(expected.size()));
  } catch (const std::exception&) {
    throw errors::ClientError(errors::Msg("Invalid identifier format"));
  }
}

User MessengerStorage::CreateUser(const std::string& login, const std::string& first_name,
                                  const std::string& last_name,
                                  const std::string& password_hash) {
  const auto seq = NextSeqId("users");
  const auto now = userver::utils::datetime::Now();
  auto users = pool_->GetCollection("users");
  try {
    users.InsertOne(MakeDoc("seq_id", seq, "login", login, "first_name", first_name, "last_name",
                            last_name, "password_hash", password_hash, "created_at", now, "tags",
                            MakeArray()));
  } catch (const userver::storages::mongo::DuplicateKeyException&) {
    throw errors::ConflictError(errors::Msg("Login already taken"));
  } catch (const userver::storages::mongo::MongoException&) {
    throw errors::ConflictError(errors::Msg("Login already taken"));
  }
  return User{
      .id = ExternalId("user-", seq),
      .login = login,
      .first_name = first_name,
      .last_name = last_name,
      .password_hash = password_hash,
      .created_at = now,
  };
}

std::optional<User> MessengerStorage::FindByLogin(const std::string& login) const {
  auto users = pool_->GetCollection("users");
  const auto doc = users.FindOne(MakeDoc("login", login));
  if (!doc) return std::nullopt;
  return DocToUser(*doc);
}

std::vector<User> MessengerStorage::SearchByMask(
    const std::optional<std::string>& first_name_mask,
    const std::optional<std::string>& last_name_mask) const {
  userver::formats::bson::Document filter = MakeDoc();
  if (first_name_mask && last_name_mask) {
    filter = MakeDoc("first_name", RegexContains(*first_name_mask), "last_name",
                     RegexContains(*last_name_mask));
  } else if (first_name_mask) {
    filter = MakeDoc("first_name", RegexContains(*first_name_mask));
  } else if (last_name_mask) {
    filter = MakeDoc("last_name", RegexContains(*last_name_mask));
  }

  auto users = pool_->GetCollection("users");
  auto cursor = users.Find(
      filter, mongo_options::Sort{std::make_pair("last_name", mongo_options::Sort::kAscending),
                                  std::make_pair("first_name", mongo_options::Sort::kAscending)});

  std::vector<User> result;
  for (const auto& doc : cursor) {
    result.push_back(DocToUser(doc));
  }
  return result;
}

GroupChat MessengerStorage::CreateGroupChat(const std::string& name,
                                            const std::string& creator_id) {
  const auto creator_pk = ParseEntityId(creator_id, "user-");
  const auto seq = NextSeqId("group_chats");
  const auto now = userver::utils::datetime::Now();

  auto chats = pool_->GetCollection("group_chats");
  chats.InsertOne(MakeDoc("seq_id", seq, "name", name, "created_by_id", creator_pk, "created_at",
                          now, "members",
                          MakeArray(MakeDoc("user_id", creator_pk, "joined_at", now,
                                            "role", "owner"))));

  return GroupChat{
      .id = ExternalId("chat-", seq),
      .name = name,
      .created_by_id = creator_id,
      .created_at = now,
  };
}

void MessengerStorage::AddMember(const std::string& chat_id, const std::string& user_id) {
  const auto chat_pk = ParseEntityId(chat_id, "chat-");
  const auto user_pk = ParseEntityId(user_id, "user-");

  if (!GetChat(chat_id)) {
    throw errors::ResourceNotFound(errors::Msg("Group chat not found"));
  }

  if (!GetUser(user_id)) {
    throw errors::ResourceNotFound(errors::Msg("User to add not found"));
  }

  if (IsMember(chat_id, user_id)) {
    throw errors::ConflictError(errors::Msg("User already in chat"));
  }

  auto chats = pool_->GetCollection("group_chats");
  chats.UpdateOne(MakeDoc("seq_id", chat_pk),
                  MakeDoc("$push", MakeDoc("members", MakeDoc("user_id", user_pk, "joined_at",
                                                              userver::utils::datetime::Now(),
                                                              "role", "member"))));
}

bool MessengerStorage::IsMember(const std::string& chat_id, const std::string& user_id) const {
  const auto chat_pk = ParseEntityId(chat_id, "chat-");
  const auto user_pk = ParseEntityId(user_id, "user-");
  auto chats = pool_->GetCollection("group_chats");
  const auto doc = chats.FindOne(
      MakeDoc("seq_id", chat_pk, "members", MakeDoc("$elemMatch", MakeDoc("user_id", user_pk))));
  return doc.has_value();
}

std::optional<GroupChat> MessengerStorage::GetChat(const std::string& chat_id) const {
  const auto chat_pk = ParseEntityId(chat_id, "chat-");
  auto chats = pool_->GetCollection("group_chats");
  const auto doc = chats.FindOne(MakeDoc("seq_id", chat_pk));
  if (!doc) return std::nullopt;
  return DocToGroupChat(*doc);
}

GroupMessage MessengerStorage::AddGroupMessage(const std::string& chat_id,
                                               const std::string& sender_id,
                                               const std::string& content) {
  const auto chat_pk = ParseEntityId(chat_id, "chat-");
  const auto sender_pk = ParseEntityId(sender_id, "user-");

  if (!GetChat(chat_id)) {
    throw errors::ResourceNotFound(errors::Msg("Group chat not found"));
  }

  const auto seq = NextSeqId("group_messages");
  const auto now = userver::utils::datetime::Now();
  auto messages = pool_->GetCollection("group_messages");
  messages.InsertOne(MakeDoc("seq_id", seq, "chat_id", chat_pk, "sender_id", sender_pk, "content",
                             content, "created_at", now, "reactions", MakeArray()));

  return GroupMessage{
      .id = ExternalId("gmsg-", seq),
      .chat_id = chat_id,
      .sender_id = sender_id,
      .content = content,
      .created_at = now,
  };
}

std::vector<GroupMessage> MessengerStorage::ListGroupMessages(const std::string& chat_id,
                                                              int limit, int offset) const {
  const auto chat_pk = ParseEntityId(chat_id, "chat-");
  auto messages = pool_->GetCollection("group_messages");
  auto cursor = messages.Find(
      MakeDoc("chat_id", chat_pk),
      mongo_options::Sort{std::make_pair("created_at", mongo_options::Sort::kAscending),
                          std::make_pair("seq_id", mongo_options::Sort::kAscending)},
      mongo_options::Limit{static_cast<std::size_t>(limit)},
      mongo_options::Skip{static_cast<std::size_t>(offset)});

  std::vector<GroupMessage> result;
  for (const auto& doc : cursor) {
    result.push_back(DocToGroupMessage(doc));
  }
  return result;
}

P2PMessage MessengerStorage::AddP2PMessage(const std::string& sender_id,
                                           const std::string& recipient_id,
                                           const std::string& content) {
  const auto sender_pk = ParseEntityId(sender_id, "user-");
  const auto recipient_pk = ParseEntityId(recipient_id, "user-");

  if (sender_pk == recipient_pk) {
    throw errors::ClientError(errors::Msg("Cannot message yourself"));
  }

  if (!GetUser(recipient_id)) {
    throw errors::ResourceNotFound(errors::Msg("Recipient not found"));
  }

  const auto seq = NextSeqId("p2p_messages");
  const auto now = userver::utils::datetime::Now();
  auto messages = pool_->GetCollection("p2p_messages");
  messages.InsertOne(MakeDoc("seq_id", seq, "sender_id", sender_pk, "recipient_id", recipient_pk,
                             "content", content, "created_at", now, "read_by", MakeArray()));

  return P2PMessage{
      .id = ExternalId("pmsg-", seq),
      .sender_id = sender_id,
      .recipient_id = recipient_id,
      .content = content,
      .created_at = now,
  };
}

std::vector<P2PMessage> MessengerStorage::ListP2PMessages(
    const std::string& user_id, const std::optional<std::string>& peer_id, int limit,
    int offset) const {
  const auto user_pk = ParseEntityId(user_id, "user-");

  userver::formats::bson::Document filter;
  if (peer_id) {
    const auto peer_pk = ParseEntityId(*peer_id, "user-");
    filter = MakeDoc("$or", MakeArray(MakeDoc("$and", MakeArray(MakeDoc("sender_id", user_pk),
                                                                 MakeDoc("recipient_id", peer_pk))),
                                      MakeDoc("$and", MakeArray(MakeDoc("sender_id", peer_pk),
                                                                MakeDoc("recipient_id", user_pk)))));
  } else {
    filter = MakeDoc("$or", MakeArray(MakeDoc("sender_id", user_pk),
                                      MakeDoc("recipient_id", user_pk)));
  }

  auto messages = pool_->GetCollection("p2p_messages");
  auto cursor = messages.Find(
      filter, mongo_options::Sort{std::make_pair("created_at", mongo_options::Sort::kAscending),
                                   std::make_pair("seq_id", mongo_options::Sort::kAscending)},
      mongo_options::Limit{static_cast<std::size_t>(limit)},
      mongo_options::Skip{static_cast<std::size_t>(offset)});

  std::vector<P2PMessage> result;
  for (const auto& doc : cursor) {
    result.push_back(DocToP2PMessage(doc));
  }
  return result;
}

std::optional<User> MessengerStorage::GetUser(const std::string& user_id) const {
  const auto user_pk = ParseEntityId(user_id, "user-");
  auto users = pool_->GetCollection("users");
  const auto doc = users.FindOne(MakeDoc("seq_id", user_pk));
  if (!doc) return std::nullopt;
  return DocToUser(*doc);
}

}
