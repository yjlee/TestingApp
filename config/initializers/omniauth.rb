OmniAuth.config.logger = Rails.logger

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :facebook, '1599854406967476', 'b50ef03fa8ff4d6bec24c111f31af06c', scope: "publish_stream"
end