import { Box, Typography } from "@mui/material";
import { Helmet } from "react-helmet-async";

export const ClientDashboard = () => {


  return (
    <Box>
      <Helmet>
        <title>Dashboard | Power Automate</title>
        <meta name="description" content="Clint dashboard" />
      </Helmet>
      <Typography gutterBottom sx={{ mb: 4, fontSize: 14 }}>
        Welcome to Power Automate. This is a web application that allows you to look up customer information.
      </Typography>
    </Box>
  );
};
