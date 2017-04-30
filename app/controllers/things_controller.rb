class ThingsController < ApplicationController
  include ActionController::Helpers
  helper ThingsHelper
  before_action :set_thing, only: [:show, :update, :destroy]
  before_action :authenticate_user!, only: [:create, :update, :destroy]
  wrap_parameters :thing, include: ["name", "description", "notes", "tag_ids"]
  after_action :verify_authorized
  after_action :verify_policy_scoped, only: [:index]

  def index
    authorize Thing
    things = policy_scope(Thing)
    things = Thing.from_tags(things, params[:tag_ids]) if can_filter?

    @things = ThingPolicy.merge(things)
  end

  def show
    authorize @thing
    things = ThingPolicy::Scope.new(current_user,
                                    Thing.where(:id=>@thing.id))
                                    .user_roles(false)
    @thing = ThingPolicy.merge(things).first
  end

  def create
    authorize Thing
    @thing = Thing.new(thing_params)

    User.transaction do
      if @thing.save
        role=current_user.add_role(Role::ORGANIZER,@thing)
        @thing.user_roles << role.role_name
        role.save!
        render :show, status: :created, location: @thing
      else
        render json: {errors:@thing.errors.messages}, status: :unprocessable_entity
      end
    end
  end

  def update
    authorize @thing

    # Wrap params not working for tag_ids.
    if @thing.update(thing_params.merge({tag_ids: params[:tag_ids]}))
      head :no_content
    else
      render json: {errors:@thing.errors.messages}, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @thing
    @thing.destroy

    head :no_content
  end

  private

    def set_thing
      @thing = Thing.find(params[:id])
    end

    def thing_params
      params.require(:thing).tap {|p|
          p.require(:name) #throws ActionController::ParameterMissing
        }.permit(:name, :description, :notes, :tag_ids)
    end

    def can_filter?
      @current_user.present?
    end
end
