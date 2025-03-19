const mongoose = require("mongoose");
const validator = require("validator");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
    },
    note: { type: String },

    websites: [
      {
        name: {
          type: String,
          required: [true, "Website must have a name"],
        },
        url: {
          type: String,
          validate: {
            validator: function (value) {
              // Validate the URL
              return (
                validator.isURL(value, {
                  require_protocol: true, // Require protocol
                  allow_underscores: true, // Allow underscores if needed
                }) && value.startsWith("https://")
              );
            },
            message: (props) =>
              `Provided URL: ${props.value} is not valid, or it does not begin with https://.
`,
          },
        },
        identificationCodeRecord: {
          type: String,
          required: [true, "Identification code is required"],
        },
        passwordRecord: {
          type: String,
          required: [true, "Password is required"],
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organization must belong to a user"],
    },
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual populate
organizationSchema.virtual("tasks", {
  ref: "Task",
  foreignField: "organization",
  localField: "_id",
});
// Cascade delete Tasks when an organization is deleted
organizationSchema.pre("findOneAndDelete", async function (next) {
  const organization = await this.model.findOne(this.getQuery());
  if (organization) {
    // Delete all tasks associated with this organization
    await organization.model("Task").deleteMany({ organization: organization._id });
  }
  next();
});

const Organization = mongoose.model("Organization", organizationSchema);
module.exports = Organization;
