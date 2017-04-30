class ThingTagsController < ApplicationController
  before_action :get_thing_tag, only: [:destroy]
  before_action :authenticate_user!

  def create
    thing_tag = ThingTag.new(thing_tag_create_params.merge({
      :tag_id=>params[:tag_id],
      :thing_id=>params[:thing_id],
      }))
    thing = Thing.where(id:thing_tag.thing_id).first

    if !thing
      full_message_error "cannot find thing[#{params[:thing_id]}]", :bad_request
      #skip_authorization
    elsif !Tag.where(id:thing_tag.tag_id).exists?
      full_message_error "cannot find tag[#{params[:tag_id]}]", :bad_request
      #skip_authorization
    else
      #authorize thing, :add_tag?
      thing_tag.creator_id = current_user.id
      if thing_tag.save
        head :no_content
      else
        render json: {errors: thing_tag.errors.messages}, status: :unprocessable_entity
      end
    end
  end

  def destroy
    #authorize @thing, :remove_tag?
    @thing_tag.destroy
    head :no_content
  end


private

  def set_thing
    @thing = Thing.find(params[:id])
  end

  def get_thing_tag
    @thing_tag = Thing.find(params[:thing_tag_id])
  end

  def thing_tag_create_params
    params.require(:thing_tag).tap {|p|
        #_ids only required in payload when not part of URI
        p.require(:tag_id)    if !params[:tag_id]
        p.require(:thing_id)    if !params[:thing_id]
      }.permit(:priority, :tag_id, :thing_id)
  end
end
