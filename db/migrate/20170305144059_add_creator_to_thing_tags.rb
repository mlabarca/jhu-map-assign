class AddCreatorToThingTags < ActiveRecord::Migration
  def change
    add_column :thing_tags, :creator_id, :integer
    add_index  :thing_tags, :creator_id
    add_foreign_key :thing_tags, :users, column: :creator_id
  end
end
