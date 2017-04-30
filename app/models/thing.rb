class Thing < ActiveRecord::Base
  include Protectable
  validates :name, :presence=>true

  has_many :thing_images, inverse_of: :thing, dependent: :destroy
  has_many :tags, through: :thing_tags
  has_many :thing_tags

  scope :not_linked, ->(image) { where.not(:id=>ThingImage.select(:thing_id)
    .where(:image=>image)) }

  def self.from_tags things, tag_ids
    if tag_ids.present?
      tag_ids = tag_ids.map(&:to_i)
      things.select{|thing| (tag_ids - thing.tags.map(&:id)).empty?}
    else
      things
    end
  end

end
