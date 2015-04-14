# config/initializers/koala.rb
# Simple approach
Koala::Facebook::OAuth.class_eval do
  def initialize_with_default_settings(*args)
    raise "application id and/or secret are not specified in the envrionment" unless ENV['1599854406967476'] && ENV['b50ef03fa8ff4d6bec24c111f31af06c']
    initialize_without_default_settings(ENV['1599854406967476'].to_s, ENV['b50ef03fa8ff4d6bec24c111f31af06c'].to_s, args.first)
  end 

  alias_method_chain :initialize, :default_settings 
end