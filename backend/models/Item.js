var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");
var slug = require("slug");
var User = mongoose.model("User");

var ItemSchema = new mongoose.Schema(
  {
    slug: { type: String, lowercase: true, unique: true },
    title: String,
    description: String,
    image: {
      type: String,
      required: true,
      validate: {
        // describe the validate feature
        validator(value) {
          // validator is a data validation feature. v is the age value
          const regex = /^(http|https?):\/\/+(www\.)?[.a-z0-9\s]{3,}\.[a-z]{2,3}(\/#?[.a-z0-9\s])?/;
          return regex.test(value);
        },
        message: 'Must be a Valid URL', // when the validator returns false, this message will be displayed
      },
    },
    favoritesCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    tagList: [{ type: String }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

ItemSchema.plugin(uniqueValidator, { message: "is already taken" });

ItemSchema.pre("validate", function(next) {
  if (!this.slug) {
    this.slugify();
  }

  next();
});

ItemSchema.methods.slugify = function() {
  this.slug =
    slug(this.title) +
    "-" +
    ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};

ItemSchema.methods.updateFavoriteCount = function() {
  var item = this;

  return User.count({ favorites: { $in: [item._id] } }).then(function(count) {
    item.favoritesCount = count;

    return item.save();
  });
};

ItemSchema.methods.toJSONFor = function(user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    image: this.image,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    seller: this.seller.toProfileJSONFor(user)
  };
};

mongoose.model("Item", ItemSchema);
