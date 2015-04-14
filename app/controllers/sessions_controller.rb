class SessionsController < ApplicationController
  def create
    user = User.from_omniauth(env["omniauth.auth"])
    session[:user_id] = user.id
    redirect_to root_url
  end
	
  
  #def status
	#@facebook ||= Koala::Facebook::API.new('CAAWvDyGeoLQBABcI8JRzHShISvqp4P2MnxkQQHwcDALkSvZAVDMn0GA6ESexPms5zELnuAve51bdU7OyMUusZA8ZBjmWr0YXYxlElplcU4D3Iwxjf2FpbRjmAFJKyfwuZBQpHwZCSq7ZAfq2rh51fa3RFH2H8D69SLXhInnb82ILxlK1HuRWsmpjrymC5ir4hJ2EhnF7zpTBs7Mj3sUEUk')
	#page_access_token = @facebook.get_connections('me', 'accounts').first('access_token')
	#@page = Koala::Facebook::API.new(page_access_token)
	#@page.put_connections(user_id, "feed", :message => @title)
	#redirect_to root_url
  #end
	
  def destroy
    session[:user_id] = nil
    redirect_to root_url
  end
end